from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.models.enums import (
    CallDirection,
    CallOutcome,
    CallStatus,
    WhisperStatus,
)

_orm = ConfigDict(from_attributes=True)


class OutboundCallRequest(BaseModel):
    to_e164: str
    role_ids: list[str] = []


class CallRead(BaseModel):
    model_config = _orm

    id: str
    user_id: str | None = None
    direction: CallDirection
    status: CallStatus
    outcome: CallOutcome | None = None
    from_e164: str | None
    to_e164: str | None
    recording_url: str | None = None
    started_at: datetime | None
    ended_at: datetime | None
    duration_seconds: int | None = None
    role_ids: list[str] = []


class CallRolesUpdate(BaseModel):
    role_ids: list[str]


class WhisperCreate(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class WhisperRead(BaseModel):
    model_config = _orm

    id: str
    call_id: str
    text: str
    status: WhisperStatus
    created_at: datetime
    spoken_at: datetime | None = None
    used_in_training: bool = False
