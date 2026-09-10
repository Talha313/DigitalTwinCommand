from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatCompletionRequest(BaseModel):
    """OpenAI-compatible request body (subset)."""

    model: str
    messages: list[ChatMessage]
    stream: bool = True
    temperature: float | None = None
    role_ids: list[str] | None = None
