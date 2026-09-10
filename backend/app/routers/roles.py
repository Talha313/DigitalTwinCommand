from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.roles import (
    PermissionCreate,
    PermissionRead,
    RoleCreate,
    RoleRead,
    RoleUpdate,
    ToolCreate,
    ToolRead,
)
from app.services.roles import (
    PermissionService,
    RoleService,
    ToolService,
    get_permissions_service,
    get_roles_service,
    get_tools_service,
)

router = APIRouter(tags=["roles"])


# --- roles ---


@router.get("/roles", response_model=list[RoleRead])
async def list_roles(service: RoleService = Depends(get_roles_service)) -> list[RoleRead]:
    return await service.list_roles()


@router.post("/roles", response_model=RoleRead, status_code=201)
async def create_role(
    body: RoleCreate, service: RoleService = Depends(get_roles_service)
) -> RoleRead:
    return await service.create_role(body)


@router.get("/roles/{role_id}", response_model=RoleRead)
async def get_role(
    role_id: str, service: RoleService = Depends(get_roles_service)
) -> RoleRead:
    return await service.get_role(role_id)


@router.patch("/roles/{role_id}", response_model=RoleRead)
async def update_role(
    role_id: str,
    body: RoleUpdate,
    service: RoleService = Depends(get_roles_service),
) -> RoleRead:
    return await service.update_role(role_id, body)


# --- permissions ---


@router.get("/permissions", response_model=list[PermissionRead])
async def list_permissions(
    service: PermissionService = Depends(get_permissions_service),
) -> list[PermissionRead]:
    return await service.list_permissions()


@router.post("/permissions", response_model=PermissionRead, status_code=201)
async def create_permission(
    body: PermissionCreate,
    service: PermissionService = Depends(get_permissions_service),
) -> PermissionRead:
    return await service.create_permission(body)


# --- tools / API access ---


@router.get("/tools", response_model=list[ToolRead])
async def list_tools(
    service: ToolService = Depends(get_tools_service),
) -> list[ToolRead]:
    return await service.list_tools()


@router.post("/tools", response_model=ToolRead, status_code=201)
async def create_tool(
    body: ToolCreate, service: ToolService = Depends(get_tools_service)
) -> ToolRead:
    return await service.create_tool(body)
