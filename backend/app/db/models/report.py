"""Report-related tables: reports and report_jobs (pipeline stages)."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin
from app.db.models.enums import ReportJobStatus, ReportStage, ReportStatus


class Report(UUIDMixin, Base):
    __tablename__ = "reports"

    date: Mapped[date | None] = mapped_column(Date, unique=True, index=True)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"), default=ReportStatus.QUEUED
    )
    brief_json: Mapped[dict | None] = mapped_column(JSONB)
    script: Mapped[str | None] = mapped_column(Text)
    tool_traces: Mapped[dict | None] = mapped_column(JSONB)
    error_message: Mapped[str | None] = mapped_column(Text)

    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_by: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    audio_url: Mapped[str | None] = mapped_column(Text)
    video_16x9: Mapped[str | None] = mapped_column(Text)
    video_9x16: Mapped[str | None] = mapped_column(Text)
    captions_url: Mapped[str | None] = mapped_column(Text)

    model: Mapped[str | None] = mapped_column(String(64))
    cost_cents: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    jobs: Mapped[list[ReportJob]] = relationship(
        back_populates="report", order_by="ReportJob.started_at"
    )


class ReportJob(UUIDMixin, Base):
    """One stage of the report generation pipeline."""

    __tablename__ = "report_jobs"

    report_id: Mapped[str] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"), index=True)
    stage: Mapped[ReportStage] = mapped_column(Enum(ReportStage, name="report_stage"))
    status: Mapped[ReportJobStatus] = mapped_column(
        Enum(ReportJobStatus, name="report_job_status"),
        default=ReportJobStatus.PENDING,
    )
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    report: Mapped[Report] = relationship(back_populates="jobs")
