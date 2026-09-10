"""DTOs for chat conversations and their messages."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.db.models.enums import MessageRole
from app.models.base import ORMModel

# --- messages --------------------------------------------------------------


class MessageCreate(BaseModel):
    content: str
    meta: dict | None = None


class MessageRead(ORMModel):
    id: str
    conversation_id: str
    role: MessageRole
    content: str
    meta: dict | None = None  # DB column "metadata"
    created_at: datetime


# --- conversations -------------------------------------------------------


class ConversationCreate(BaseModel):
    title: str | None = None
    role_ids: list[str] = []


class ConversationUpdate(BaseModel):
    title: str | None = None


class ConversationRolesUpdate(BaseModel):
    role_ids: list[str]


class ConversationListItem(ORMModel):
    """Row in the conversation list — no messages."""

    id: str
    user_id: str | None = None
    title: str | None
    created_at: datetime
    updated_at: datetime
    role_ids: list[str] = []
    message_count: int = 0


class ConversationRead(ORMModel):
    id: str
    user_id: str | None = None
    title: str | None
    created_at: datetime
    updated_at: datetime
    role_ids: list[str] = []
    messages: list[MessageRead] = []
