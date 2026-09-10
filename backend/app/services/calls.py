from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import db_session
from app.errors import NotImplementedYet
from app.services.base import Service

from app.models.calls import CallRead, CallRolesUpdate, OutboundCallRequest
from app.models.utterances import UtteranceRead


class CallService(Service):
    async def start_outbound(self, data: OutboundCallRequest) -> CallRead:
        raise NotImplementedYet("Outbound calls are not implemented yet.")

    async def list_calls(self) -> list[CallRead]:
        raise NotImplementedYet("Call listing is not implemented yet.")

    async def get_call(self, call_id: str) -> CallRead:
        raise NotImplementedYet("Call detail is not implemented yet.")

    async def list_utterances(self, call_id: str) -> list[UtteranceRead]:
        raise NotImplementedYet("Transcripts are not implemented yet.")

    async def set_roles(self, call_id: str, data: CallRolesUpdate) -> CallRead:
        raise NotImplementedYet("Call role changes are not implemented yet.")

    async def mute(self, call_id: str) -> CallRead:
        raise NotImplementedYet("Call controls are not implemented yet.")

    async def hold(self, call_id: str) -> CallRead:
        raise NotImplementedYet("Call controls are not implemented yet.")

    async def hangup(self, call_id: str) -> CallRead:
        raise NotImplementedYet("Call controls are not implemented yet.")



def get_calls_service(session: AsyncSession = Depends(db_session)) -> CallService:
    return CallService(session)
