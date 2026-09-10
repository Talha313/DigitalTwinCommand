from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import db_session
from app.errors import NotImplementedYet
from app.models.roles import (
    PermissionCreate,
    PermissionRead,
    RoleCreate,
    RoleRead,
    RoleUpdate,
    ToolCreate,
    ToolRead,
)
from app.services.base import Service


class RoleService(Service):
    async def list_roles(self) -> list[RoleRead]:
        raise NotImplementedYet("Role listing is not implemented yet.")

    async def get_role(self, role_id: str) -> RoleRead:
        raise NotImplementedYet("Role detail is not implemented yet.")

    async def create_role(self, data: RoleCreate) -> RoleRead:
        raise NotImplementedYet("Role creation is not implemented yet.")

    async def update_role(self, role_id: str, data: RoleUpdate) -> RoleRead:
        raise NotImplementedYet("Role updates are not implemented yet.")


class PermissionService(Service):
    async def list_permissions(self) -> list[PermissionRead]:
        raise NotImplementedYet("Permission listing is not implemented yet.")

    async def create_permission(self, data: PermissionCreate) -> PermissionRead:
        raise NotImplementedYet("Permission creation is not implemented yet.")


class ToolService(Service):
    async def list_tools(self) -> list[ToolRead]:
        raise NotImplementedYet("Tool listing is not implemented yet.")

    async def create_tool(self, data: ToolCreate) -> ToolRead:
        raise NotImplementedYet("Tool creation is not implemented yet.")


def get_roles_service(session: AsyncSession = Depends(db_session)) -> RoleService:
    return RoleService(session)


def get_permissions_service(
    session: AsyncSession = Depends(db_session),
) -> PermissionService:
    return PermissionService(session)


def get_tools_service(session: AsyncSession = Depends(db_session)) -> ToolService:
    return ToolService(session)
