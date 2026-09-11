from __future__ import annotations

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.dependencies import db_session
from app.errors import ValidationError
from app.models.auth import UserRead
from app.models.users import UserRoleUpdate
from app.services.base import Service


class UserService(Service):
    async def list_users(self) -> list[UserRead]:
        rows = (
            (await self.session.execute(select(User).order_by(User.created_at)))
            .scalars()
            .all()
        )
        return [UserRead.model_validate(r) for r in rows]

    async def update_user(
        self, user_id: str, data: UserRoleUpdate, *, acting_user_id: str
    ) -> UserRead:
        if user_id == acting_user_id:
            raise ValidationError("You can't change your own role or status here.")

        user = await self._get(User, user_id, label="User")
        patch = data.model_dump(exclude_unset=True)
        for field in ("role", "status"):
            if field in patch:
                setattr(user, field, patch[field])
        await self.session.flush()
        return UserRead.model_validate(user)


def get_users_service(session: AsyncSession = Depends(db_session)) -> UserService:
    return UserService(session)
