from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response

from app.core.ratelimit import limiter
from app.db.models.enums import UserRole
from app.db.models.user import User
from app.dependencies import require_role
from app.models.calls import WhisperCreate, WhisperRead
from app.services.calls import CallService, get_calls_service

router = APIRouter(prefix="/calls", tags=["whispers"])


@router.post("/{call_id}/whispers", response_model=WhisperRead, status_code=201)
@limiter.limit("30/minute")
async def create_whisper(
    request: Request,
    response: Response,
    call_id: str,
    body: WhisperCreate,
    user: User = Depends(require_role(UserRole.OPERATOR)),
    service: CallService = Depends(get_calls_service),
) -> WhisperRead:
    return await service.create_whisper(call_id, body, user_id=str(user.id))
