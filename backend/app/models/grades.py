"""DTOs for the grades resource."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models.base import ORMModel


class GradeCreate(BaseModel):
    subject_type: str
    subject_id: str
    score: float | None = None
    notes: str | None = None
    grader_model: str | None = None


class GradeRead(ORMModel):
    id: str
    subject_type: str
    subject_id: str
    score: float | None = None
    notes: str | None = None
    grader_model: str | None = None
    created_at: datetime
