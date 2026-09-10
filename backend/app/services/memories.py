from __future__ import annotations

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.enums import MemoryStatus
from app.db.models.memory import Memory
from app.dependencies import db_session
from app.models.memories import MemoryCreate, MemoryRead, MemoryStatusUpdate
from app.services.base import Service, as_uuid


class MemoryService(Service):
    async def list_memories(
        self, status: MemoryStatus | None = None, *, limit: int = 200
    ) -> list[MemoryRead]:
        stmt = select(Memory).order_by(Memory.created_at.desc()).limit(limit)
        if status is not None:
            stmt = stmt.where(Memory.status == status)
        rows = (await self.session.execute(stmt)).scalars().all()
        return [MemoryRead.model_validate(r) for r in rows]

    async def get(self, memory_id: str) -> MemoryRead:
        return MemoryRead.model_validate(await self._get(Memory, memory_id, label="Memory"))

    async def create(self, data: MemoryCreate) -> MemoryRead:
        mem = Memory(
            content=data.content,
            source_type=data.source_type,
            confidence=data.confidence,
            user_id=as_uuid(data.user_id) if data.user_id else None,
            status=MemoryStatus.PENDING,
        )
        self.session.add(mem)
        await self.session.flush()
        return MemoryRead.model_validate(mem)

    async def set_status(self, memory_id: str, data: MemoryStatusUpdate) -> MemoryRead:
        mem = await self._get(Memory, memory_id, label="Memory")
        mem.status = data.status
        await self.session.flush()
        return MemoryRead.model_validate(mem)


def get_memories_service(session: AsyncSession = Depends(db_session)) -> MemoryService:
    return MemoryService(session)
