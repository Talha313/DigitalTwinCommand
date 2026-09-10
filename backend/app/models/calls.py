from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.db.models.enums import (
    CallDirection,
    CallOutcome,
    CallStatus,
    WhisperKind,
    WhisperStatus,
)
from app.models.base import ORMModel


class OutboundCallRequest(BaseModel):
    to_e164: str = Field(pattern=r"^\+[1-9]\d{6,14}$")
    role_ids: list[str] = []
    first_message: str | None = Field(default=None, max_length=500)
    recording_consent: bool = False


class CallRead(ORMModel):
    id: str
    user_id: str | None = None
    direction: CallDirection
    status: CallStatus
    outcome: CallOutcome | None = None
    from_e164: str | None
    to_e164: str | None
    twilio_sid: str | None = None
    eleven_conversation_id: str | None = None
    recording_url: str | None = None
    recording_consent: bool = False
    model: str | None = None
    summary: str | None = None
    tool_call_count: int = 0
    cost_cents: int | None = None
    started_at: datetime | None
    ended_at: datetime | None
    duration_seconds: int | None = None
    created_at: datetime
    role_ids: list[str] = []


class CallRolesUpdate(BaseModel):
    role_ids: list[str]


class CallOutcomeUpdate(BaseModel):
    outcome: CallOutcome
    summary: str | None = None


class WhisperCreate(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    kind: WhisperKind = WhisperKind.CONTEXTUAL_UPDATE


class WhisperRead(ORMModel):
    id: str
    call_id: str
    text: str
    kind: WhisperKind
    status: WhisperStatus
    created_at: datetime
    injected_at: datetime | None = None
    spoken_at: datetime | None = None
    used_in_training: bool = False
