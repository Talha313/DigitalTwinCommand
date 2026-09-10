from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.dependencies import current_user
from app.db.models.user import User
from app.models.chat import ChatRequest
from app.services.chat import ChatService, get_chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    user: User = Depends(current_user),
    service: ChatService = Depends(get_chat_service),
) -> StreamingResponse:
    """Server-Sent Events: {type: start|delta|done|error, ...}."""
    return StreamingResponse(
        service.stream(body, user_id=str(user.id)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
