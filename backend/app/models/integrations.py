"""DTOs for the integrations resource. ``configuration`` may hold secrets and is
never returned in read models."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.models.enums import IntegrationStatus

_orm = ConfigDict(from_attributes=True)


class IntegrationCreate(BaseModel):
    name: str
    provider: str
    type: str | None = None
    configuration: dict | None = None
    status: IntegrationStatus = IntegrationStatus.DISABLED


class IntegrationUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    status: IntegrationStatus | None = None
    configuration: dict | None = None


class IntegrationRead(BaseModel):
    model_config = _orm

    id: str
    name: str
    provider: str
    type: str | None = None
    status: IntegrationStatus
    created_at: datetime


class ConnectionTestResult(BaseModel):
    ok: bool
    status: IntegrationStatus
    detail: str | None = None
