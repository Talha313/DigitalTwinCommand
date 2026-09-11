from __future__ import annotations

from fastapi import APIRouter, Depends

from app.db.models.enums import UserRole
from app.db.models.user import User
from app.dependencies import require_role
from app.models.auth import UserRead
from app.models.users import UserRoleUpdate
from app.services.users import UserService, get_users_service

router = APIRouter(prefix="/users", tags=["users"])

_admin = require_role(UserRole.ADMIN)


@router.get("", response_model=list[UserRead])
async def list_users(
    _: User = Depends(_admin),
    service: UserService = Depends(get_users_service),
) -> list[UserRead]:
    return await service.list_users()


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: str,
    body: UserRoleUpdate,
    acting_user: User = Depends(_admin),
    service: UserService = Depends(get_users_service),
) -> UserRead:
    return await service.update_user(user_id, body, acting_user_id=str(acting_user.id))
