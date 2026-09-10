from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import db_session
from app.errors import NotImplementedYet
from app.services.base import Service

from app.models.calls import WhisperCreate, WhisperRead


class WhisperService(Service):
    async def create(self, call_id: str, data: WhisperCreate) -> WhisperRead:
        raise NotImplementedYet("Whispers are not implemented yet.")



def get_whispers_service(session: AsyncSession = Depends(db_session)) -> WhisperService:
    return WhisperService(session)
