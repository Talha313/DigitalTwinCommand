"""The daily 10-minute market report pipeline (spec §8).

research (Grok + web_search) -> script -> [approve] -> voice (ElevenLabs PVC)
-> avatar (HeyGen/D-ID) -> package (ffmpeg) -> upload (S3) -> READY
"""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime

from sqlalchemy import select

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models.enums import ReportJobStatus, ReportStage, ReportStatus
from app.db.models.report import Report, ReportJob
from app.db.session import session_scope
from app.errors import AppError
from app.providers.elevenlabs import elevenlabs_client
from app.providers.lipsync import lipsync_client
from app.providers.storage import storage
from app.providers.xai_client import xai_client
from app.services import media
from app.services.base import as_uuid

log = get_logger(__name__)

_RESEARCH_SYSTEM = (
    "You are a markets research assistant. Use web search to gather today's "
    "facts. Return ONLY compact JSON with keys: as_of (ISO datetime), indices "
    "(list of {name, level, change_pct}), movers (list of {ticker, note}), "
    "rates (string), headlines (list of exactly 3 strings), risk (string), "
    "opportunity (string). Cite dates inside strings. Never invent a print."
)

_SCRIPT_SYSTEM = (
    "You write Howie Merriman's daily market video in his voice: short "
    "sentences, direct, warm, opinionated, no filler, never 'as an AI', no "
    "'in today's video'. Structure: hook -> overnight/tape -> three stories -> "
    "what it means for a normal investor -> close with tomorrow's watch. "
    "1,250-1,500 spoken words (~10 minutes). Cite dates. If a number is "
    "uncertain, say so. Output the spoken script only — no headings, no notes."
)


def _cost_cents(usage: dict) -> int:
    """xAI reports the exact billed cost per request as cost_in_usd_ticks,
    where 1 USD = 10^10 ticks — no pricing table to keep in sync."""
    ticks = usage.get("cost_in_usd_ticks") or 0
    return round(ticks / 1e10 * 100)


class ReportGone(AppError):
    """The report row was deleted while a job for it was still queued."""

    status_code = 410
    code = "report_gone"


async def _require_report(report_id: str) -> None:
    async with session_scope() as session:
        if await session.get(Report, as_uuid(report_id)) is None:
            raise ReportGone(f"Report {report_id} no longer exists.")


async def _stage(
    report_id: str,
    stage: ReportStage,
    status: ReportJobStatus,
    *,
    error: str | None = None,
) -> None:
    async with session_scope() as session:
        if await session.get(Report, as_uuid(report_id)) is None:
            return
        row = (
            await session.execute(
                select(ReportJob).where(
                    ReportJob.report_id == as_uuid(report_id),
                    ReportJob.stage == stage,
                )
            )
        ).scalar_one_or_none()
        now = datetime.now(UTC)
        if row is None:
            row = ReportJob(report_id=as_uuid(report_id), stage=stage)
            session.add(row)
        row.status = status
        if status == ReportJobStatus.RUNNING:
            if row.started_at is None:
                row.started_at = now
            row.completed_at = None  # clear a stale timestamp from a previous attempt
        elif status in {ReportJobStatus.COMPLETED, ReportJobStatus.FAILED}:
            row.completed_at = now
        row.error_message = error


async def _set_status(report_id: str, status: ReportStatus, *, error: str | None = None) -> None:
    """error=None clears any stale error_message from a previous failed
    attempt — every non-FAILED call site here passes no error, so a fresh
    RESEARCHING/GENERATING/etc. transition always starts clean instead of
    leaving an old failure banner showing after a successful retry."""
    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        if report is not None:
            report.status = status
            report.error_message = error


async def research_and_script(report_id: str) -> ReportStatus:
    """Stages 1-2. Ends at SCRIPT_READY (or APPROVED if approval is off)."""
    await _require_report(report_id)
    log.info("report %s using xAI (%s) for research + script", report_id, settings.xai_model)
    await _set_status(report_id, ReportStatus.RESEARCHING)
    await _stage(report_id, ReportStage.RESEARCH, ReportJobStatus.RUNNING)
    try:
        res = await xai_client.complete(
            system=_RESEARCH_SYSTEM,
            messages=[{"role": "user", "content": "Prepare today's market brief."}],
            web_search=True,
            max_tokens=4000,
        )
        brief = _parse_json(res["text"])
    except AppError as exc:
        await _stage(report_id, ReportStage.RESEARCH, ReportJobStatus.FAILED, error=exc.message)
        await _set_status(report_id, ReportStatus.FAILED, error=exc.message)
        raise

    cost_cents = _cost_cents(res.get("usage", {}))

    x_search_trace: dict | None = None
    if xai_client.configured:
        try:
            x_res = await xai_client.x_search(
                "What is being said on X/Twitter today about markets, stocks, "
                "rates, and the economy? Summarize the most notable posts."
            )
            cost_cents += _cost_cents(x_res.get("usage", {}))
            if x_res["text"]:
                brief["social_headlines"] = x_res["text"]
                x_search_trace = {"citations": x_res["citations"], "model": x_res.get("model")}
        except AppError:
            log.warning("report %s: xAI x_search enrichment failed, continuing without it", report_id)

    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        if report is None:
            raise ReportGone(f"Report {report_id} no longer exists.")
        report.brief_json = brief
        report.tool_traces = {"research": res.get("tool_traces", []), "x_search": x_search_trace}
        report.model = res.get("model")
    await _stage(report_id, ReportStage.RESEARCH, ReportJobStatus.COMPLETED)

    await _stage(report_id, ReportStage.SCRIPT, ReportJobStatus.RUNNING)
    try:
        script_res = await xai_client.complete(
            system=_SCRIPT_SYSTEM,
            messages=[
                {
                    "role": "user",
                    "content": f"Today's brief:\n{json.dumps(brief, indent=2)}",
                }
            ],
            max_tokens=6000,
        )
    except AppError as exc:
        await _stage(report_id, ReportStage.SCRIPT, ReportJobStatus.FAILED, error=exc.message)
        await _set_status(report_id, ReportStatus.FAILED, error=exc.message)
        raise
    cost_cents += _cost_cents(script_res.get("usage", {}))
    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        if report is None:
            raise ReportGone(f"Report {report_id} no longer exists.")
        report.script = script_res["text"]
        report.cost_cents = cost_cents
    await _stage(report_id, ReportStage.SCRIPT, ReportJobStatus.COMPLETED)

    if settings.report_approval_required:
        await _set_status(report_id, ReportStatus.SCRIPT_READY)
        return ReportStatus.SCRIPT_READY
    await _set_status(report_id, ReportStatus.APPROVED)
    return ReportStatus.APPROVED


def _report_key(report) -> str:
    return f"reports/{report.date or report.id}"


def _chunk_script(script: str, *, max_chars: int = 2200) -> list[str]:
    """One TTS request for the full ~1,250-1,500 word (~9,000 char) script
    can stall ElevenLabs for minutes and sometimes never returns at all
    (see the ReadTimeout that used to fail render_report outright). Split on
    sentence boundaries into request-sized chunks and synthesize each
    separately instead — media.concat_audio stitches the results back into
    one file."""
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", script.strip()) if s.strip()]
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        candidate = f"{current} {sentence}".strip() if current else sentence
        if len(candidate) > max_chars and current:
            chunks.append(current)
            current = sentence
        else:
            current = candidate
    if current:
        chunks.append(current)
    return chunks or [script]


async def render(report_id: str) -> None:
    """Stages 4-7: voice -> avatar -> package -> upload.

    ``heygen`` / ``did`` / a configured ``elevenlabs`` (ELEVENLABS_API_KEY +
    DID_SOURCE_URL — see lipsync.py) run end-to-end automatically. Only an
    unconfigured ``elevenlabs`` parks the report at ``AWAITING_AVATAR`` for an
    operator to render in ElevenCreative and upload via
    ``POST /api/reports/{id}/avatar``.
    """
    await _require_report(report_id)
    await _set_status(report_id, ReportStatus.GENERATING)
    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        if report is None:
            raise ReportGone(f"Report {report_id} no longer exists.")
        script = report.script or ""
        report_key = _report_key(report)
    if not script:
        await _set_status(report_id, ReportStatus.FAILED, error="No script to render.")
        raise AppError("No script to render.")

    await _stage(report_id, ReportStage.VOICE, ReportJobStatus.RUNNING)
    audio_key = f"{report_key}/audio.mp3"
    if await storage.exists(audio_key):
        # A retry after a later stage (avatar) failed — the script hasn't
        # changed, so re-synthesizing would waste ElevenLabs credits and,
        # worse, could shift audio byte-length slightly and desync the
        # per-segment avatar cache in lipsync.py, which keys off this exact
        # audio content staying stable across attempts.
        log.info("report %s: reusing existing audio (already synthesized)", report_id)
        audio_url = await storage.url_for(audio_key)
    else:
        chunks = _chunk_script(script)
        log.info("report %s: synthesizing voice in %d chunk(s)", report_id, len(chunks))
        try:
            audio_parts = [await elevenlabs_client.tts(chunk) for chunk in chunks]
        except AppError as exc:
            await _stage(report_id, ReportStage.VOICE, ReportJobStatus.FAILED, error=exc.message)
            await _set_status(report_id, ReportStatus.FAILED, error=exc.message)
            raise
        audio = await media.concat_audio(audio_parts)
        audio_url = await storage.put(audio_key, audio, content_type="audio/mpeg")
    await _stage(report_id, ReportStage.VOICE, ReportJobStatus.COMPLETED)

    total_seconds = max(60.0, len(script.split()) / 150 * 60)
    srt_text = media.build_srt(script, total_seconds=total_seconds)
    captions_url = await storage.put(
        f"{report_key}/captions.srt", srt_text.encode(), content_type="text/plain"
    )
    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        report.audio_url = audio_url
        report.captions_url = captions_url

    await _stage(report_id, ReportStage.AVATAR, ReportJobStatus.RUNNING)
    if lipsync_client.provider == "elevenlabs" and not lipsync_client.automated:
        await _stage(
            report_id,
            ReportStage.AVATAR,
            ReportJobStatus.RUNNING,
            error="Awaiting manual render in ElevenCreative — audio + captions ready.",
        )
        await _set_status(report_id, ReportStatus.AWAITING_AVATAR)
        log.info("report %s AWAITING_AVATAR (elevenlabs not configured)", report_id)
        return

    results: dict[str, str] = {}
    try:
        for aspect in ("16x9", "9x16"):
            raw_video_url = await lipsync_client.render(audio_url=audio_url, aspect=aspect)
            results[aspect] = raw_video_url
    except AppError as exc:
        await _stage(report_id, ReportStage.AVATAR, ReportJobStatus.FAILED, error=exc.message)
        await _set_status(report_id, ReportStatus.FAILED, error=exc.message)
        raise
    await _stage(report_id, ReportStage.AVATAR, ReportJobStatus.COMPLETED)
    await finalize_from_videos(report_id, results, srt_text=srt_text)


async def finalize_from_videos(
    report_id: str, raw_videos: dict[str, str], *, srt_text: str | None = None
) -> None:
    """Stages 5-7: ffmpeg package (captions + loudnorm) -> S3 -> READY.
    ``raw_videos`` maps '16x9'/'9x16' to a downloadable source MP4 URL."""
    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        if report is None:
            raise ReportGone(f"Report {report_id} no longer exists.")
        report_key = _report_key(report)
        script = report.script or ""
        if srt_text is None:
            total = max(60.0, len(script.split()) / 150 * 60)
            srt_text = media.build_srt(script, total_seconds=total)

    await _stage(report_id, ReportStage.PROCESSING, ReportJobStatus.RUNNING)
    final: dict[str, str] = {}
    for aspect, src in raw_videos.items():
        if not src:
            continue
        if media.ffmpeg_available():
            packaged = await media.package(video_url=src, srt_text=srt_text, aspect=aspect)
            final[aspect] = await storage.put(
                f"{report_key}/video_{aspect}.mp4", packaged, content_type="video/mp4"
            )
        else:
            log.warning("ffmpeg not found — storing source video for %s", aspect)
            final[aspect] = src
    await _stage(report_id, ReportStage.PROCESSING, ReportJobStatus.COMPLETED)

    await _stage(report_id, ReportStage.UPLOAD, ReportJobStatus.RUNNING)
    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        if "16x9" in final:
            report.video_16x9 = final["16x9"]
        if "9x16" in final:
            report.video_9x16 = final["9x16"]
        report.status = ReportStatus.READY
        report.error_message = None
    await _stage(report_id, ReportStage.UPLOAD, ReportJobStatus.COMPLETED)
    log.info("report %s READY", report_id)


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1].removeprefix("json").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start : end + 1])
        raise
