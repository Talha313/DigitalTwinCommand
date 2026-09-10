from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.calls import WhisperCreate, WhisperRead
from app.services.whispers import WhisperService, get_whispers_service

router = APIRouter(prefix="/calls", tags=["whispers"])


@router.post("/{call_id}/whispers", response_model=WhisperRead)
async def create_whisper(
    call_id: str,
    body: WhisperCreate,
    service: WhisperService = Depends(get_whispers_service),
) -> WhisperRead:
    return await service.create(call_id, body)
