from __future__ import annotations

from collections.abc import AsyncIterator, Callable

import jwt
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_token
from app.db.models.enums import UserRole, UserStatus
from app.db.models.user import User
from app.db.session import get_session
from app.errors import AuthError, ForbiddenError

_ROLE_RANK = {UserRole.VIEWER: 0, UserRole.OPERATOR: 1, UserRole.ADMIN: 2}


async def db_session() -> AsyncIterator[AsyncSession]:
    async for session in get_session():
        yield session


def _extract_token(request: Request) -> str | None:
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        return header[7:].strip()
    return request.cookies.get(settings.auth_cookie_name)


async def current_user(
    request: Request, session: AsyncSession = Depends(db_session)
) -> User:
    token = _extract_token(request)
    if not token:
        raise AuthError("Not authenticated.")
    try:
        payload = decode_token(token, expected_type="access")
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("Session expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthError("Invalid session.") from exc

    user = await session.get(User, payload["sub"])
    if user is None:
        raise AuthError("Account no longer exists.")
    if user.status != UserStatus.ACTIVE:
        raise ForbiddenError("This account is disabled.")
    return user


async def current_user_optional(
    request: Request, session: AsyncSession = Depends(db_session)
) -> User | None:
    try:
        return await current_user(request, session)
    except (AuthError, ForbiddenError):
        return None


def require_role(minimum: UserRole) -> Callable[[User], User]:
    async def _guard(user: User = Depends(current_user)) -> User:
        if _ROLE_RANK[user.role] < _ROLE_RANK[minimum]:
            raise ForbiddenError(f"Requires {minimum.value} role or higher.")
        return user

    return _guard
