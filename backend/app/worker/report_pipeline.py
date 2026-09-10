"""The daily 10-minute market report pipeline (spec §8).

research (Claude + web_search) -> script -> [approve] -> voice (ElevenLabs PVC)
-> avatar (HeyGen/D-ID) -> package (ffmpeg) -> upload (S3) -> READY
"""

from __future__ import annotations

import json
from datetime import UTC, datetime

from sqlalchemy import select

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models.enums import ReportJobStatus, ReportStage, ReportStatus
from app.db.models.report import Report, ReportJob
from app.db.session import session_scope
from app.errors import AppError
from app.providers.anthropic_client import anthropic_client
from app.providers.elevenlabs import elevenlabs_client
from app.providers.lipsync import lipsync_client
from app.providers.storage import storage
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


async def _stage(
    report_id: str,
    stage: ReportStage,
    status: ReportJobStatus,
    *,
    error: str | None = None,
) -> None:
    async with session_scope() as session:
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
        if status == ReportJobStatus.RUNNING and row.started_at is None:
            row.started_at = now
        if status in {ReportJobStatus.COMPLETED, ReportJobStatus.FAILED}:
            row.completed_at = now
        row.error_message = error


async def _set_status(report_id: str, status: ReportStatus, *, error: str | None = None) -> None:
    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        if report is not None:
            report.status = status
            if error is not None:
                report.error_message = error


async def research_and_script(report_id: str) -> ReportStatus:
    """Stages 1-2. Ends at SCRIPT_READY (or APPROVED if approval is off)."""
    # --- research ---
    await _set_status(report_id, ReportStatus.RESEARCHING)
    await _stage(report_id, ReportStage.RESEARCH, ReportJobStatus.RUNNING)
    try:
        res = await anthropic_client.complete(
            system=_RESEARCH_SYSTEM,
            messages=[{"role": "user", "content": "Prepare today's market brief."}],
            model=settings.anthropic_report_model,
            web_search=True,
            max_tokens=4000,
        )
        brief = _parse_json(res["text"])
    except AppError as exc:
        await _stage(report_id, ReportStage.RESEARCH, ReportJobStatus.FAILED, error=exc.message)
        await _set_status(report_id, ReportStatus.FAILED, error=exc.message)
        raise
    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        report.brief_json = brief
        report.tool_traces = {"research": res.get("tool_traces", [])}
        report.model = res.get("model")
    await _stage(report_id, ReportStage.RESEARCH, ReportJobStatus.COMPLETED)

    # --- script ---
    await _stage(report_id, ReportStage.SCRIPT, ReportJobStatus.RUNNING)
    try:
        script_res = await anthropic_client.complete(
            system=_SCRIPT_SYSTEM,
            messages=[
                {
                    "role": "user",
                    "content": f"Today's brief:\n{json.dumps(brief, indent=2)}",
                }
            ],
            model=settings.anthropic_report_model,
            max_tokens=6000,
        )
    except AppError as exc:
        await _stage(report_id, ReportStage.SCRIPT, ReportJobStatus.FAILED, error=exc.message)
        await _set_status(report_id, ReportStatus.FAILED, error=exc.message)
        raise
    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        report.script = script_res["text"]
    await _stage(report_id, ReportStage.SCRIPT, ReportJobStatus.COMPLETED)

    if settings.report_approval_required:
        await _set_status(report_id, ReportStatus.SCRIPT_READY)
        return ReportStatus.SCRIPT_READY
    await _set_status(report_id, ReportStatus.APPROVED)
    return ReportStatus.APPROVED


async def render(report_id: str) -> None:
    """Stages 4-7: voice -> avatar -> package -> upload."""
    await _set_status(report_id, ReportStatus.GENERATING)
    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        script = report.script or ""
        report_key = f"reports/{report.date or report_id}"
    if not script:
        await _set_status(report_id, ReportStatus.FAILED, error="No script to render.")
        raise AppError("No script to render.")

    # --- voice ---
    await _stage(report_id, ReportStage.VOICE, ReportJobStatus.RUNNING)
    audio = await elevenlabs_client.tts(script)
    audio_url = await storage.put(f"{report_key}/audio.mp3", audio, content_type="audio/mpeg")
    await _stage(report_id, ReportStage.VOICE, ReportJobStatus.COMPLETED)
    async with session_scope() as session:
        (await session.get(Report, as_uuid(report_id))).audio_url = audio_url

    # rough duration estimate: ~150 wpm
    total_seconds = max(60.0, len(script.split()) / 150 * 60)
    srt_text = media.build_srt(script, total_seconds=total_seconds)
    captions_url = await storage.put(
        f"{report_key}/captions.srt", srt_text.encode(), content_type="text/plain"
    )

    # --- avatar + package for both aspect ratios ---
    await _stage(report_id, ReportStage.AVATAR, ReportJobStatus.RUNNING)
    results: dict[str, str] = {}
    for aspect in ("16x9", "9x16"):
        raw_video_url = await lipsync_client.render(audio_url=audio_url, aspect=aspect)
        await _stage(report_id, ReportStage.PROCESSING, ReportJobStatus.RUNNING)
        if media.ffmpeg_available():
            packaged = await media.package(
                video_url=raw_video_url, srt_text=srt_text, aspect=aspect
            )
            results[aspect] = await storage.put(
                f"{report_key}/video_{aspect}.mp4", packaged, content_type="video/mp4"
            )
        else:
            log.warning("ffmpeg not found — storing raw avatar video for %s", aspect)
            results[aspect] = raw_video_url
    await _stage(report_id, ReportStage.AVATAR, ReportJobStatus.COMPLETED)
    await _stage(report_id, ReportStage.PROCESSING, ReportJobStatus.COMPLETED)

    # --- finalise ---
    await _stage(report_id, ReportStage.UPLOAD, ReportJobStatus.RUNNING)
    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        report.captions_url = captions_url
        report.video_16x9 = results.get("16x9")
        report.video_9x16 = results.get("9x16")
        report.status = ReportStatus.READY
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
