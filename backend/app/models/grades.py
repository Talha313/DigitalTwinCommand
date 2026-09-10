"""DTOs for the grades resource."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

_orm = ConfigDict(from_attributes=True)


class GradeCreate(BaseModel):
    subject_type: str
    subject_id: str
    score: float | None = None
    notes: str | None = None
    grader_model: str | None = None


class GradeRead(BaseModel):
    model_config = _orm

    id: str
    subject_type: str
    subject_id: str
    score: float | None = None
    notes: str | None = None
    grader_model: str | None = None
    created_at: datetime
