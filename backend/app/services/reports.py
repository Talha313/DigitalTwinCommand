from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import db_session
from app.errors import NotImplementedYet
from app.services.base import Service

from app.models.reports import (
    ReportApproveResponse,
    ReportJobRead,
    ReportListItem,
    ReportRead,
)


class ReportService(Service):
    async def list_reports(self) -> list[ReportListItem]:
        raise NotImplementedYet("Reports are not implemented yet.")

    async def get_report(self, report_id: str) -> ReportRead:
        raise NotImplementedYet("Reports are not implemented yet.")

    async def approve(self, report_id: str) -> ReportApproveResponse:
        raise NotImplementedYet("Report approval is not implemented yet.")

    async def list_jobs(self, report_id: str) -> list[ReportJobRead]:
        raise NotImplementedYet("Report jobs are not implemented yet.")



def get_reports_service(session: AsyncSession = Depends(db_session)) -> ReportService:
    return ReportService(session)
