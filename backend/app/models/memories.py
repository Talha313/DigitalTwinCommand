"""DTOs for the memory / knowledge store."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.models.enums import MemorySourceType, MemoryStatus

_orm = ConfigDict(from_attributes=True)


class MemoryCreate(BaseModel):
    content: str
    source_type: MemorySourceType
    confidence: float | None = Field(default=None, ge=0, le=1)
    user_id: str | None = None


class MemoryStatusUpdate(BaseModel):
    status: MemoryStatus


class MemoryRead(BaseModel):
    model_config = _orm

    id: str
    user_id: str | None = None
    content: str
    source_type: MemorySourceType
    confidence: float | None = None
    status: MemoryStatus
    created_at: datetime
