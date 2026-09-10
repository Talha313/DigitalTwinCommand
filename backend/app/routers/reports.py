from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.db.models.enums import UserRole
from app.db.models.user import User
from app.dependencies import current_user, require_role
from app.models.reports import (
    ReportApproveResponse,
    ReportJobRead,
    ReportListItem,
    ReportRead,
)
from app.services.reports import ReportService, get_reports_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[ReportListItem])
async def list_reports(
    _: User = Depends(current_user),
    service: ReportService = Depends(get_reports_service),
) -> list[ReportListItem]:
    return await service.list_reports()


@router.post("/generate", response_model=ReportRead, status_code=202)
async def generate_report_now(
    force: bool = Query(default=False),
    _: User = Depends(require_role(UserRole.OPERATOR)),
    service: ReportService = Depends(get_reports_service),
) -> ReportRead:
    return await service.create_for_today(force=force)


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(
    report_id: str,
    _: User = Depends(current_user),
    service: ReportService = Depends(get_reports_service),
) -> ReportRead:
    return await service.get_report(report_id)


@router.post("/{report_id}/approve", response_model=ReportApproveResponse)
async def approve_report(
    report_id: str,
    user: User = Depends(require_role(UserRole.OPERATOR)),
    service: ReportService = Depends(get_reports_service),
) -> ReportApproveResponse:
    return await service.approve(report_id, user_id=str(user.id))


@router.get("/{report_id}/jobs", response_model=list[ReportJobRead])
async def list_report_jobs(
    report_id: str,
    _: User = Depends(current_user),
    service: ReportService = Depends(get_reports_service),
) -> list[ReportJobRead]:
    return await service.list_jobs(report_id)
