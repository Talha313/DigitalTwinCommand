from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.calls import CallRead, CallRolesUpdate, OutboundCallRequest
from app.models.utterances import UtteranceRead
from app.services.calls import CallService, get_calls_service

router = APIRouter(prefix="/calls", tags=["calls"])


@router.post("/outbound", response_model=CallRead)
async def start_outbound_call(
    body: OutboundCallRequest, service: CallService = Depends(get_calls_service)
) -> CallRead:
    return await service.start_outbound(body)


@router.get("", response_model=list[CallRead])
async def list_calls(service: CallService = Depends(get_calls_service)) -> list[CallRead]:
    return await service.list_calls()


@router.get("/{call_id}", response_model=CallRead)
async def get_call(
    call_id: str, service: CallService = Depends(get_calls_service)
) -> CallRead:
    return await service.get_call(call_id)


@router.get("/{call_id}/transcript", response_model=list[UtteranceRead])
async def get_transcript(
    call_id: str, service: CallService = Depends(get_calls_service)
) -> list[UtteranceRead]:
    return await service.list_utterances(call_id)


@router.put("/{call_id}/roles", response_model=CallRead)
async def set_call_roles(
    call_id: str, body: CallRolesUpdate, service: CallService = Depends(get_calls_service)
) -> CallRead:
    return await service.set_roles(call_id, body)


@router.post("/{call_id}/mute", response_model=CallRead)
async def mute_call(call_id: str, service: CallService = Depends(get_calls_service)) -> CallRead:
    return await service.mute(call_id)


@router.post("/{call_id}/hold", response_model=CallRead)
async def hold_call(call_id: str, service: CallService = Depends(get_calls_service)) -> CallRead:
    return await service.hold(call_id)


@router.post("/{call_id}/hangup", response_model=CallRead)
async def hangup_call(
    call_id: str, service: CallService = Depends(get_calls_service)
) -> CallRead:
    return await service.hangup(call_id)
