from __future__ import annotations

import asyncio
from datetime import UTC, date, datetime

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.db.models.enums import ReportStatus
from app.db.models.report import Report, ReportJob
from app.dependencies import db_session
from app.errors import ConflictError, NotConfiguredError, ValidationError
from app.models.reports import (
    ReportApproveResponse,
    ReportJobRead,
    ReportListItem,
    ReportRead,
)
from app.providers.storage import storage
from app.services.base import Service, as_uuid

log = get_logger(__name__)

_bg_tasks: set[asyncio.Task] = set()


class ReportService(Service):
    async def list_reports(self, *, limit: int = 60) -> list[ReportListItem]:
        rows = (
            (
                await self.session.execute(
                    select(Report).order_by(Report.created_at.desc()).limit(limit)
                )
            )
            .scalars()
            .all()
        )
        return [ReportListItem.model_validate(r) for r in rows]

    async def get_report(self, report_id: str) -> ReportRead:
        return ReportRead.model_validate(await self._get(Report, report_id, label="Report"))

    async def list_jobs(self, report_id: str) -> list[ReportJobRead]:
        await self._get(Report, report_id, label="Report")
        rows = (
            (
                await self.session.execute(
                    select(ReportJob)
                    .where(ReportJob.report_id == as_uuid(report_id))
                    .order_by(ReportJob.started_at.nulls_last(), ReportJob.id)
                )
            )
            .scalars()
            .all()
        )
        return [ReportJobRead.model_validate(r) for r in rows]

    async def approve(self, report_id: str, *, user_id: str | None = None) -> ReportApproveResponse:
        report = await self._get(Report, report_id, label="Report")
        if report.status != ReportStatus.SCRIPT_READY:
            raise ValidationError(
                f"Report is {report.status.value} — only a script_ready report can be approved."
            )
        report.status = ReportStatus.APPROVED
        report.approved_at = datetime.now(UTC)
        report.approved_by = as_uuid(user_id) if user_id else None
        await self.session.flush()

        from app.worker.queue import enqueue

        await enqueue("render_report", str(report.id))
        return ReportApproveResponse(id=str(report.id), status=report.status)

    async def submit_avatar(
        self,
        report_id: str,
        *,
        files: dict[str, bytes] | None = None,
        urls: dict[str, str] | None = None,
    ) -> ReportRead:
        """Operator hands back the ElevenCreative render(s); resume packaging."""
        report = await self._get(Report, report_id, label="Report")
        if report.status not in {
            ReportStatus.AWAITING_AVATAR,
            ReportStatus.GENERATING,
            ReportStatus.READY,
        }:
            raise ValidationError(
                f"Report is {report.status.value} — nothing is waiting on an avatar render."
            )

        raw: dict[str, str] = {}
        key = f"reports/{report.date or report.id}"
        for aspect in ("16x9", "9x16"):
            if files and files.get(aspect):
                if not storage.configured:
                    raise NotConfiguredError("S3 is not configured — cannot store the upload.")
                raw[aspect] = await storage.put(
                    f"{key}/source_{aspect}.mp4", files[aspect], content_type="video/mp4"
                )
            elif urls and urls.get(aspect):
                raw[aspect] = urls[aspect]
        if not raw:
            raise ValidationError(
                "Provide at least one rendered video (file_16x9 / file_9x16 or a URL)."
            )

        report.status = ReportStatus.GENERATING
        report.error_message = None
        await self.session.flush()

        from app.worker.queue import enqueue

        job = await enqueue("package_report", str(report.id), raw)
        if job is None:
            # No Redis (e.g. local dev) — package inline, best effort.
            task = asyncio.create_task(_safe_finalize(str(report.id), raw))
            _bg_tasks.add(task)
            task.add_done_callback(_bg_tasks.discard)
        return ReportRead.model_validate(report)

    async def create_for_today(self, *, force: bool = False) -> ReportRead:
        """Idempotent — one report per calendar date (spec §8.4)."""
        today = date.today()
        existing = (
            await self.session.execute(select(Report).where(Report.date == today))
        ).scalar_one_or_none()
        if existing is not None and not force:
            raise ConflictError(f"A report for {today.isoformat()} already exists.")
        if existing is not None:
            report = existing
            report.status = ReportStatus.QUEUED
            report.error_message = None
        else:
            report = Report(date=today, status=ReportStatus.QUEUED)
            self.session.add(report)
        await self.session.flush()

        from app.worker.queue import enqueue

        await enqueue("generate_report", str(report.id))
        return ReportRead.model_validate(report)


async def _safe_finalize(report_id: str, raw: dict[str, str]) -> None:
    from app.worker.report_pipeline import finalize_from_videos

    try:
        await finalize_from_videos(report_id, raw)
    except Exception:
        log.exception("inline report packaging failed report=%s", report_id)


def get_reports_service(session: AsyncSession = Depends(db_session)) -> ReportService:
    return ReportService(session)
