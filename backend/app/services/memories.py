from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import db_session
from app.errors import NotImplementedYet
from app.models.memories import MemoryCreate, MemoryRead, MemoryStatusUpdate
from app.services.base import Service


class MemoryService(Service):
    async def list_memories(
        self, status: str | None = None
    ) -> list[MemoryRead]:
        raise NotImplementedYet("Memories are not implemented yet.")

    async def get(self, memory_id: str) -> MemoryRead:
        raise NotImplementedYet("Memories are not implemented yet.")

    async def create(self, data: MemoryCreate) -> MemoryRead:
        raise NotImplementedYet("Memories are not implemented yet.")

    async def set_status(
        self, memory_id: str, data: MemoryStatusUpdate
    ) -> MemoryRead:
        raise NotImplementedYet("Memory review is not implemented yet.")


def get_memories_service(
    session: AsyncSession = Depends(db_session),
) -> MemoryService:
    return MemoryService(session)
