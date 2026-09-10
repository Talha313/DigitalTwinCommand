from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.db.models.enums import MemoryStatus, UserRole
from app.db.models.user import User
from app.dependencies import current_user, require_role
from app.models.memories import MemoryCreate, MemoryRead, MemoryStatusUpdate
from app.services.memories import MemoryService, get_memories_service

router = APIRouter(prefix="/memories", tags=["memories"])


@router.get("", response_model=list[MemoryRead])
async def list_memories(
    status: MemoryStatus | None = Query(default=None),
    _: User = Depends(current_user),
    service: MemoryService = Depends(get_memories_service),
) -> list[MemoryRead]:
    return await service.list_memories(status)


@router.post("", response_model=MemoryRead, status_code=201)
async def create_memory(
    body: MemoryCreate,
    _: User = Depends(require_role(UserRole.OPERATOR)),
    service: MemoryService = Depends(get_memories_service),
) -> MemoryRead:
    return await service.create(body)


@router.get("/{memory_id}", response_model=MemoryRead)
async def get_memory(
    memory_id: str,
    _: User = Depends(current_user),
    service: MemoryService = Depends(get_memories_service),
) -> MemoryRead:
    return await service.get(memory_id)


@router.patch("/{memory_id}/status", response_model=MemoryRead)
async def set_memory_status(
    memory_id: str,
    body: MemoryStatusUpdate,
    _: User = Depends(require_role(UserRole.OPERATOR)),
    service: MemoryService = Depends(get_memories_service),
) -> MemoryRead:
    return await service.set_status(memory_id, body)
