from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.db.models.enums import MemoryStatus
from app.models.memories import MemoryCreate, MemoryRead, MemoryStatusUpdate
from app.services.memories import MemoryService, get_memories_service

router = APIRouter(prefix="/memories", tags=["memories"])


@router.get("", response_model=list[MemoryRead])
async def list_memories(
    status: MemoryStatus | None = Query(default=None),
    service: MemoryService = Depends(get_memories_service),
) -> list[MemoryRead]:
    return await service.list_memories(status)


@router.post("", response_model=MemoryRead, status_code=201)
async def create_memory(
    body: MemoryCreate,
    service: MemoryService = Depends(get_memories_service),
) -> MemoryRead:
    return await service.create(body)


@router.get("/{memory_id}", response_model=MemoryRead)
async def get_memory(
    memory_id: str, service: MemoryService = Depends(get_memories_service)
) -> MemoryRead:
    return await service.get(memory_id)


@router.patch("/{memory_id}/status", response_model=MemoryRead)
async def set_memory_status(
    memory_id: str,
    body: MemoryStatusUpdate,
    service: MemoryService = Depends(get_memories_service),
) -> MemoryRead:
    return await service.set_status(memory_id, body)
