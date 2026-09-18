from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Dashboard chat with the twin. Streams the assistant reply as SSE and
    persists both turns to the conversation."""

    conversation_id: str | None = None
    content: str = Field(min_length=1, max_length=8000)
    role_ids: list[str] = []
    title: str | None = None


class ChatChunk(BaseModel):
    type: str
    conversation_id: str | None = None
    message_id: str | None = None
    text: str | None = None
    error: str | None = None
