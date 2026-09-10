"""DTOs for the audit-log resource (read-only)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

_orm = ConfigDict(from_attributes=True)


class AuditLogRead(BaseModel):
    model_config = _orm

    id: str
    user_id: str | None = None
    action: str
    entity_type: str | None = None
    entity_id: str | None = None
    meta: dict | None = None  # DB column "metadata"
    created_at: datetime
