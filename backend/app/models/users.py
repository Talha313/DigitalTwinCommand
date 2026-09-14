from __future__ import annotations

from pydantic import BaseModel

from app.db.models.enums import UserRole, UserStatus


class UserRoleUpdate(BaseModel):
    """Admin-only: promote/demote a user or activate/deactivate their account."""

    role: UserRole | None = None
    status: UserStatus | None = None
