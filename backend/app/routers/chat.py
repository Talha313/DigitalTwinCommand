from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.errors import NotImplementedYet
from app.models.chat import ChatCompletionRequest
from app.services.chat import ChatService, get_chat_service

router = APIRouter(tags=["llm"])


@router.post("/v1/chat/completions")
async def chat_completions(
    body: ChatCompletionRequest,
    request: Request,
    service: ChatService = Depends(get_chat_service),
):
    """OpenAI-compatible Chat Completions (SSE). Aborts on caller disconnect."""
    if not body.stream:
        raise NotImplementedYet("Non-streaming chat completions are not implemented yet.")
    return StreamingResponse(service.stream(body), media_type="text/event-stream")
