"""DTOs for the reports resource."""

from __future__ import annotations

from datetime import date as _date
from datetime import datetime

from pydantic import BaseModel

from app.db.models.enums import ReportJobStatus, ReportStage, ReportStatus
from app.models.base import ORMModel


class ReportListItem(ORMModel):
    id: str
    date: _date | None = None
    status: ReportStatus
    model: str | None = None
    cost_cents: int | None = None
    created_at: datetime


class ReportRead(ORMModel):
    id: str
    date: _date | None = None
    status: ReportStatus
    brief_json: dict | None = None
    script: str | None = None
    audio_url: str | None = None
    video_16x9: str | None = None
    video_9x16: str | None = None
    captions_url: str | None = None
    model: str | None = None
    cost_cents: int | None = None
    created_at: datetime


class ReportApproveResponse(BaseModel):
    id: str
    status: ReportStatus


class ReportJobRead(ORMModel):
    id: str
    report_id: str
    stage: ReportStage
    status: ReportJobStatus
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
