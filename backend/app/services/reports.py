from __future__ import annotations

from datetime import UTC, date, datetime

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.enums import ReportStatus
from app.db.models.report import Report, ReportJob
from app.dependencies import db_session
from app.errors import ConflictError, ValidationError
from app.models.reports import (
    ReportApproveResponse,
    ReportJobRead,
    ReportListItem,
    ReportRead,
)
from app.services.base import Service, as_uuid


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


def get_reports_service(session: AsyncSession = Depends(db_session)) -> ReportService:
    return ReportService(session)
