"""DTOs for the memory / knowledge store."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.db.models.enums import MemorySourceType, MemoryStatus
from app.models.base import ORMModel


class MemoryCreate(BaseModel):
    content: str
    source_type: MemorySourceType
    confidence: float | None = Field(default=None, ge=0, le=1)
    user_id: str | None = None


class MemoryStatusUpdate(BaseModel):
    status: MemoryStatus


class MemoryRead(ORMModel):
    id: str
    user_id: str | None = None
    content: str
    source_type: MemorySourceType
    confidence: float | None = None
    status: MemoryStatus
    created_at: datetime
