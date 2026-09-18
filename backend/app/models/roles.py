"""DTOs for all role-related resources: roles, permissions, tools, and the
role ↔ permission / role ↔ tool grants."""

from __future__ import annotations

from pydantic import BaseModel

from app.db.models.enums import RiskLevel
from app.models.base import ORMModel



class PermissionRead(ORMModel):
    id: str
    name: str
    description: str | None = None


class PermissionCreate(BaseModel):
    name: str
    description: str | None = None




class ToolRead(ORMModel):
    id: str
    name: str
    provider: str | None = None
    description: str | None = None


class ToolCreate(BaseModel):
    name: str
    provider: str | None = None
    description: str | None = None


class RoleToolAccess(ORMModel):
    """A tool granted to a role, with its enabled flag (role_tools row)."""

    tool: ToolRead
    enabled: bool = True




class RoleBase(BaseModel):
    name: str
    description: str | None = None
    personality: dict | None = None
    tone: str | None = None
    risk_level: RiskLevel = RiskLevel.MEDIUM
    is_active: bool = True


class RoleCreate(RoleBase):
    permission_ids: list[str] = []
    tool_ids: list[str] = []


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    personality: dict | None = None
    tone: str | None = None
    risk_level: RiskLevel | None = None
    is_active: bool | None = None
    permission_ids: list[str] | None = None
    tool_ids: list[str] | None = None


class RoleRead(RoleBase, ORMModel):
    id: str
    permissions: list[PermissionRead] = []
    tools: list[RoleToolAccess] = []
