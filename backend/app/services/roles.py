from __future__ import annotations

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.role import Permission, Role, RolePermission, RoleTool, Tool
from app.dependencies import db_session
from app.errors import ConflictError, NotFoundError, ValidationError
from app.models.roles import (
    PermissionCreate,
    PermissionRead,
    RoleCreate,
    RoleRead,
    RoleToolAccess,
    RoleUpdate,
    ToolCreate,
    ToolRead,
)
from app.services.base import Service, as_uuid

_ROLE_OPTS = [selectinload(Role.permissions), selectinload(Role.tools)]


def _role_read(role: Role, tool_enabled: dict[str, bool]) -> RoleRead:
    return RoleRead(
        id=str(role.id),
        name=role.name,
        description=role.description,
        personality=role.personality,
        tone=role.tone,
        risk_level=role.risk_level,
        is_active=role.is_active,
        permissions=[PermissionRead.model_validate(p) for p in role.permissions],
        tools=[
            RoleToolAccess(
                tool=ToolRead.model_validate(t),
                enabled=tool_enabled.get(str(t.id), True),
            )
            for t in role.tools
        ],
    )


class RoleService(Service):
    async def _load(self, role_id: str) -> Role:
        return await self._get(Role, role_id, options=_ROLE_OPTS, label="Role")

    async def _tool_enabled_map(self, role_id: str) -> dict[str, bool]:
        rows = (
            await self.session.execute(
                select(RoleTool).where(RoleTool.role_id == as_uuid(role_id))
            )
        ).scalars()
        return {str(r.tool_id): r.enabled for r in rows}

    async def list_roles(self) -> list[RoleRead]:
        roles = (
            (await self.session.execute(select(Role).options(*_ROLE_OPTS).order_by(Role.name)))
            .scalars()
            .all()
        )
        out = []
        for role in roles:
            out.append(_role_read(role, await self._tool_enabled_map(str(role.id))))
        return out

    async def get_role(self, role_id: str) -> RoleRead:
        role = await self._load(role_id)
        return _role_read(role, await self._tool_enabled_map(role_id))

    async def create_role(self, data: RoleCreate) -> RoleRead:
        await self._assert_refs(data.permission_ids, data.tool_ids)
        role = Role(
            name=data.name,
            description=data.description,
            personality=data.personality,
            tone=data.tone,
            risk_level=data.risk_level,
            is_active=data.is_active,
        )
        self.session.add(role)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError(f"A role named {data.name!r} already exists.") from exc

        for pid in dict.fromkeys(data.permission_ids):
            self.session.add(RolePermission(role_id=role.id, permission_id=as_uuid(pid)))
        for tid in dict.fromkeys(data.tool_ids):
            self.session.add(RoleTool(role_id=role.id, tool_id=as_uuid(tid), enabled=True))
        await self.session.flush()
        return await self.get_role(str(role.id))

    async def update_role(self, role_id: str, data: RoleUpdate) -> RoleRead:
        role = await self._load(role_id)
        patch = data.model_dump(exclude_unset=True)

        for field in ("name", "description", "personality", "tone", "risk_level", "is_active"):
            if field in patch:
                setattr(role, field, patch[field])

        if data.permission_ids is not None:
            await self._assert_refs(data.permission_ids, [])
            await self.session.execute(
                RolePermission.__table__.delete().where(
                    RolePermission.role_id == role.id
                )
            )
            for pid in dict.fromkeys(data.permission_ids):
                self.session.add(
                    RolePermission(role_id=role.id, permission_id=as_uuid(pid))
                )

        if data.tool_ids is not None:
            await self._assert_refs([], data.tool_ids)
            existing = await self._tool_enabled_map(role_id)
            await self.session.execute(
                RoleTool.__table__.delete().where(RoleTool.role_id == role.id)
            )
            for tid in dict.fromkeys(data.tool_ids):
                self.session.add(
                    RoleTool(
                        role_id=role.id,
                        tool_id=as_uuid(tid),
                        enabled=existing.get(str(tid), True),
                    )
                )

        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError("That role name is already taken.") from exc
        return await self.get_role(role_id)

    async def _assert_refs(self, permission_ids: list[str], tool_ids: list[str]) -> None:
        if permission_ids:
            found = (
                await self.session.execute(
                    select(Permission.id).where(
                        Permission.id.in_([as_uuid(p) for p in permission_ids])
                    )
                )
            ).scalars().all()
            missing = {str(p) for p in permission_ids} - {str(f) for f in found}
            if missing:
                raise ValidationError(f"Unknown permission id(s): {', '.join(missing)}")
        if tool_ids:
            found = (
                await self.session.execute(
                    select(Tool.id).where(Tool.id.in_([as_uuid(t) for t in tool_ids]))
                )
            ).scalars().all()
            missing = {str(t) for t in tool_ids} - {str(f) for f in found}
            if missing:
                raise ValidationError(f"Unknown tool id(s): {', '.join(missing)}")


class PermissionService(Service):
    async def list_permissions(self) -> list[PermissionRead]:
        rows = (
            await self.session.execute(select(Permission).order_by(Permission.name))
        ).scalars().all()
        return [PermissionRead.model_validate(r) for r in rows]

    async def create_permission(self, data: PermissionCreate) -> PermissionRead:
        perm = Permission(name=data.name, description=data.description)
        self.session.add(perm)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError(f"Permission {data.name!r} already exists.") from exc
        return PermissionRead.model_validate(perm)


class ToolService(Service):
    async def list_tools(self) -> list[ToolRead]:
        rows = (
            await self.session.execute(select(Tool).order_by(Tool.name))
        ).scalars().all()
        return [ToolRead.model_validate(r) for r in rows]

    async def create_tool(self, data: ToolCreate) -> ToolRead:
        tool = Tool(name=data.name, provider=data.provider, description=data.description)
        self.session.add(tool)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ConflictError(f"Tool {data.name!r} already exists.") from exc
        return ToolRead.model_validate(tool)


def get_roles_service(session: AsyncSession = Depends(db_session)) -> RoleService:
    return RoleService(session)


def get_permissions_service(
    session: AsyncSession = Depends(db_session),
) -> PermissionService:
    return PermissionService(session)


def get_tools_service(session: AsyncSession = Depends(db_session)) -> ToolService:
    return ToolService(session)


# Re-exported for services that need to resolve a role's live config.
async def load_roles_for_prompt(session: AsyncSession, role_ids: list[str]) -> list[Role]:
    if not role_ids:
        return []
    rows = (
        await session.execute(
            select(Role)
            .options(*_ROLE_OPTS)
            .where(Role.id.in_([as_uuid(r) for r in role_ids]))
        )
    ).scalars().all()
    if not rows:
        raise NotFoundError("None of the requested roles exist.")
    return list(rows)
