"""Grades — quality scores for graded subjects (messages, utterances, calls,
reports, memories, ...). Used to build the future training dataset."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin


class Grade(UUIDMixin, Base):
    __tablename__ = "grades"

    subject_type: Mapped[str] = mapped_column(String(60))  # e.g. "message", "call", "report"
    subject_id: Mapped[uuid.UUID] = mapped_column(Uuid, index=True)
    score: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text)
    grader_model: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
