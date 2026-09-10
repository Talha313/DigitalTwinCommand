from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.db.models.enums import UserRole
from app.db.models.user import User
from app.dependencies import current_user, require_role
from app.models.calls import (
    CallOutcomeUpdate,
    CallRead,
    CallRolesUpdate,
    OutboundCallRequest,
)
from app.models.utterances import UtteranceRead
from app.services.calls import CallService, get_calls_service

router = APIRouter(prefix="/calls", tags=["calls"])


@router.get("", response_model=list[CallRead])
async def list_calls(
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    _: User = Depends(current_user),
    service: CallService = Depends(get_calls_service),
) -> list[CallRead]:
    return await service.list_calls(limit=limit, offset=offset)


@router.post("/outbound", response_model=CallRead, status_code=201)
async def start_outbound_call(
    body: OutboundCallRequest,
    user: User = Depends(require_role(UserRole.OPERATOR)),
    service: CallService = Depends(get_calls_service),
) -> CallRead:
    return await service.start_outbound(body, user_id=str(user.id))


@router.get("/{call_id}", response_model=CallRead)
async def get_call(
    call_id: str,
    _: User = Depends(current_user),
    service: CallService = Depends(get_calls_service),
) -> CallRead:
    return await service.get_call(call_id)


@router.get("/{call_id}/transcript", response_model=list[UtteranceRead])
async def get_transcript(
    call_id: str,
    _: User = Depends(current_user),
    service: CallService = Depends(get_calls_service),
) -> list[UtteranceRead]:
    return await service.list_utterances(call_id)


@router.put("/{call_id}/roles", response_model=CallRead)
async def set_call_roles(
    call_id: str,
    body: CallRolesUpdate,
    _: User = Depends(require_role(UserRole.OPERATOR)),
    service: CallService = Depends(get_calls_service),
) -> CallRead:
    return await service.set_roles(call_id, body)


@router.patch("/{call_id}/outcome", response_model=CallRead)
async def set_call_outcome(
    call_id: str,
    body: CallOutcomeUpdate,
    _: User = Depends(require_role(UserRole.OPERATOR)),
    service: CallService = Depends(get_calls_service),
) -> CallRead:
    return await service.set_outcome(call_id, body)


@router.post("/{call_id}/mute", response_model=CallRead)
async def mute_call(
    call_id: str,
    muted: bool = Query(default=True),
    _: User = Depends(require_role(UserRole.OPERATOR)),
    service: CallService = Depends(get_calls_service),
) -> CallRead:
    return await service.mute(call_id, muted=muted)


@router.post("/{call_id}/hold", response_model=CallRead)
async def hold_call(
    call_id: str,
    held: bool = Query(default=True),
    _: User = Depends(require_role(UserRole.OPERATOR)),
    service: CallService = Depends(get_calls_service),
) -> CallRead:
    return await service.hold(call_id, held=held)


@router.post("/{call_id}/hangup", response_model=CallRead)
async def hangup_call(
    call_id: str,
    _: User = Depends(require_role(UserRole.OPERATOR)),
    service: CallService = Depends(get_calls_service),
) -> CallRead:
    return await service.hangup(call_id)
