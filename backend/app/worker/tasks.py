from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import select

from app.core.logging import get_logger
from app.db.models.enums import (
    MemorySourceType,
    MemoryStatus,
    ReportStatus,
    UserRole,
)
from app.db.models.memory import Memory
from app.db.models.report import Report
from app.db.models.user import User
from app.db.session import session_scope
from app.providers.xai_client import xai_client
from app.services.base import as_uuid
from app.services.notifications import create_notifications
from app.services.push import notify_users
from app.worker.report_pipeline import (
    ReportGone,
    finalize_from_videos,
    render,
    research_and_script,
)

log = get_logger(__name__)


async def run_daily_report(ctx: dict[str, Any]) -> str:
    """Cron entrypoint — idempotent per calendar date."""
    today = date.today()
    async with session_scope() as session:
        existing = (
            await session.execute(select(Report).where(Report.date == today))
        ).scalar_one_or_none()
        if existing and existing.status not in {ReportStatus.FAILED}:
            log.info("daily report for %s already exists (%s)", today, existing.status)
            return str(existing.id)
        report = existing or Report(date=today)
        report.status = ReportStatus.QUEUED
        report.error_message = None
        session.add(report)
        await session.flush()
        report_id = str(report.id)

    await generate_report(ctx, report_id)
    return report_id


async def generate_report(ctx: dict[str, Any], report_id: str) -> None:
    try:
        result = await research_and_script(report_id)
    except ReportGone:
        log.info("report %s was deleted; dropping job", report_id)
        return
    except Exception as exc:
        log.exception("report %s research/script failed", report_id)
        await _page_operators(report_id, f"Report generation failed: {exc}")
        return

    if result == ReportStatus.APPROVED:
        await render_report(ctx, report_id)
    else:
        await _page_operators(report_id, "Daily report script is ready for review.")


async def render_report(ctx: dict[str, Any], report_id: str) -> None:
    try:
        await render(report_id)
    except ReportGone:
        log.info("report %s was deleted; dropping job", report_id)
        return
    except Exception as exc:
        log.exception("report %s render failed", report_id)
        await _page_operators(report_id, f"Report render failed: {exc}")
        return

    async with session_scope() as session:
        report = await session.get(Report, as_uuid(report_id))
        status = report.status if report else None
    if status == ReportStatus.AWAITING_AVATAR:
        await _page_operators(
            report_id,
            "Daily report audio + captions are ready — render the avatar in "
            "ElevenCreative and upload it (POST /api/reports/{id}/avatar).",
        )
    else:
        await _page_operators(report_id, "Daily market report is ready.")


async def package_report(ctx: dict[str, Any], report_id: str, raw_videos: dict[str, str]) -> None:
    try:
        await finalize_from_videos(report_id, raw_videos)
    except ReportGone:
        log.info("report %s was deleted; dropping job", report_id)
        return
    except Exception as exc:
        log.exception("report %s packaging failed", report_id)
        await _page_operators(report_id, f"Report packaging failed: {exc}")
        return
    await _page_operators(report_id, "Daily market report is ready.")


async def summarize_call(ctx: dict[str, Any], call_id: str) -> None:
    """Post-call enrichment: a one-line summary + candidate training memories."""
    if not xai_client.configured:
        return
    from app.db.models.call import Call
    from app.db.models.utterance import Utterance

    async with session_scope() as session:
        call = await session.get(Call, as_uuid(call_id))
        if call is None:
            return
        rows = (
            (
                await session.execute(
                    select(Utterance)
                    .where(Utterance.call_id == as_uuid(call_id))
                    .order_by(Utterance.timestamp)
                )
            )
            .scalars()
            .all()
        )
        transcript = "\n".join(f"{u.speaker.value}: {u.text}" for u in rows)
        if not transcript.strip():
            return

    try:
        res = await xai_client.complete(
            system=(
                "Summarise this phone call in one sentence, then on new lines list "
                "0-5 durable facts worth remembering about the caller or the "
                "relationship, one per line prefixed with '- '."
            ),
            messages=[{"role": "user", "content": transcript[:12000]}],
            max_tokens=600,
        )
    except Exception:
        log.warning("call %s summary failed", call_id)
        return

    lines = [ln.strip() for ln in res["text"].splitlines() if ln.strip()]
    summary = lines[0] if lines else None
    facts = [ln[2:].strip() for ln in lines[1:] if ln.startswith("- ")]

    async with session_scope() as session:
        call = await session.get(Call, as_uuid(call_id))
        if call is not None and summary:
            call.summary = summary
            call.model = res.get("model")
        for fact in facts:
            session.add(
                Memory(
                    content=fact,
                    source_type=MemorySourceType.CALL,
                    status=MemoryStatus.PENDING,
                    confidence=0.5,
                )
            )


async def _page_operators(report_id: str, message: str) -> None:
    async with session_scope() as session:
        op_ids = [
            str(u)
            for u in (
                await session.execute(
                    select(User.id).where(User.role.in_([UserRole.ADMIN, UserRole.OPERATOR]))
                )
            ).scalars()
        ]
    payload = {
        "title": "Digital Twin — Daily report",
        "body": message,
        "url": f"/reports/{report_id}",
        "tag": "daily-report",
    }
    await notify_users(op_ids, payload)
    await create_notifications(op_ids, **payload)
    log.info("paged operators: %s", message)
