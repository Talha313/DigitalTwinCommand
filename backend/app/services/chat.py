from __future__ import annotations

from collections.abc import AsyncIterator

from app.errors import NotImplementedYet
from app.models.chat import ChatCompletionRequest


class ChatService:
    """Backs POST /v1/chat/completions."""

    async def stream(self, request: ChatCompletionRequest) -> AsyncIterator[str]:
        raise NotImplementedYet("Streaming chat completions are not implemented yet.")
        if False:  # pragma: no cover  — keeps this an async generator
            yield ""


def get_chat_service() -> ChatService:
    return ChatService()
