from __future__ import annotations

from fastapi import APIRouter, Depends

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
    service: ReportService = Depends(get_reports_service),
) -> list[ReportListItem]:
    return await service.list_reports()


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(
    report_id: str, service: ReportService = Depends(get_reports_service)
) -> ReportRead:
    return await service.get_report(report_id)


@router.post("/{report_id}/approve", response_model=ReportApproveResponse)
async def approve_report(
    report_id: str, service: ReportService = Depends(get_reports_service)
) -> ReportApproveResponse:
    return await service.approve(report_id)


@router.get("/{report_id}/jobs", response_model=list[ReportJobRead])
async def list_report_jobs(
    report_id: str, service: ReportService = Depends(get_reports_service)
) -> list[ReportJobRead]:
    return await service.list_jobs(report_id)
