from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from app.db.models.enums import UserRole
from app.db.models.user import User
from app.dependencies import current_user, require_role
from app.errors import ValidationError
from app.models.reports import (
    ReportApproveResponse,
    ReportJobRead,
    ReportListItem,
    ReportRead,
)
from app.services.reports import ReportService, get_reports_service

router = APIRouter(prefix="/reports", tags=["reports"])

_MAX_VIDEO_BYTES = 500 * 1024 * 1024


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


@router.post("/{report_id}/avatar", response_model=ReportRead, status_code=202)
async def submit_report_avatar(
    report_id: str,
    file_16x9: UploadFile | None = File(default=None),
    file_9x16: UploadFile | None = File(default=None),
    video_16x9_url: str | None = Form(default=None),
    video_9x16_url: str | None = Form(default=None),
    _: User = Depends(require_role(UserRole.OPERATOR)),
    service: ReportService = Depends(get_reports_service),
) -> ReportRead:
    """Hand back the ElevenCreative render for a report parked at
    ``awaiting_avatar``. Upload the MP4(s) as multipart files, or pass hosted
    URLs. The pipeline then burns captions + loudnorm and publishes."""
    files: dict[str, bytes] = {}
    for aspect, upload in (("16x9", file_16x9), ("9x16", file_9x16)):
        if upload is None:
            continue
        data = await upload.read()
        if len(data) > _MAX_VIDEO_BYTES:
            raise ValidationError(f"{aspect} video exceeds 500 MB.")
        files[aspect] = data
    urls = {"16x9": video_16x9_url, "9x16": video_9x16_url}
    return await service.submit_avatar(
        report_id, files=files or None, urls={k: v for k, v in urls.items() if v} or None
    )


@router.get("/{report_id}/jobs", response_model=list[ReportJobRead])
async def list_report_jobs(
    report_id: str,
    _: User = Depends(current_user),
    service: ReportService = Depends(get_reports_service),
) -> list[ReportJobRead]:
    return await service.list_jobs(report_id)
