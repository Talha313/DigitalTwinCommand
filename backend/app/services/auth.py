from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import (
    create_token,
    decode_token,
    hash_password,
    needs_rehash,
    verify_password,
)
from app.db.models.auth_token import PasswordResetToken, RefreshSession
from app.db.models.enums import UserRole, UserStatus
from app.db.models.user import User
from app.dependencies import db_session
from app.errors import AuthError, ConflictError, ForbiddenError
from app.models.auth import (
    ForgotPasswordResponse,
    LoginRequest,
    ResetPasswordRequest,
    SessionResponse,
    SignupRequest,
    UserRead,
)
from app.services.base import Service

log = get_logger(__name__)


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


class AuthService(Service):
    # --- registration / login ------------------------------------------------

    async def signup(
        self, data: SignupRequest, *, user_agent: str | None = None, ip: str | None = None
    ) -> SessionResponse:
        existing = (
            await self.session.execute(select(User).where(User.email == data.email.lower()))
        ).scalar_one_or_none()
        if existing is not None:
            raise ConflictError("An account with this email already exists.")

        # First account created becomes an admin; subsequent ones are operators.
        any_user = (await self.session.execute(select(User.id).limit(1))).first()
        user = User(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            role=UserRole.ADMIN if any_user is None else UserRole.OPERATOR,
            status=UserStatus.ACTIVE,
        )
        self.session.add(user)
        await self.session.flush()
        return await self._issue_session(user, user_agent=user_agent, ip=ip)

    async def login(
        self, data: LoginRequest, *, user_agent: str | None = None, ip: str | None = None
    ) -> SessionResponse:
        user = (
            await self.session.execute(select(User).where(User.email == data.email.lower()))
        ).scalar_one_or_none()
        if user is None or not verify_password(data.password, user.password_hash):
            raise AuthError("Incorrect email or password.")
        if user.status != UserStatus.ACTIVE:
            raise ForbiddenError("This account is disabled.")
        if needs_rehash(user.password_hash):
            user.password_hash = hash_password(data.password)
        return await self._issue_session(user, user_agent=user_agent, ip=ip)

    async def refresh(
        self, refresh_token: str, *, user_agent: str | None = None, ip: str | None = None
    ) -> SessionResponse:
        try:
            payload = decode_token(refresh_token, expected_type="refresh")
        except Exception as exc:
            raise AuthError("Invalid or expired session.") from exc

        token_hash = _hash_token(refresh_token)
        session_row = (
            await self.session.execute(
                select(RefreshSession).where(RefreshSession.token_hash == token_hash)
            )
        ).scalar_one_or_none()
        now = datetime.now(UTC)
        if (
            session_row is None
            or session_row.revoked_at is not None
            or session_row.expires_at < now
        ):
            raise AuthError("Invalid or expired session.")

        user = await self._get(User, payload["sub"], label="User")
        if user.status != UserStatus.ACTIVE:
            raise ForbiddenError("This account is disabled.")

        session_row.revoked_at = now  # rotate
        return await self._issue_session(user, user_agent=user_agent, ip=ip)

    async def logout(self, refresh_token: str | None) -> None:
        if not refresh_token:
            return
        row = (
            await self.session.execute(
                select(RefreshSession).where(
                    RefreshSession.token_hash == _hash_token(refresh_token)
                )
            )
        ).scalar_one_or_none()
        if row is not None and row.revoked_at is None:
            row.revoked_at = datetime.now(UTC)

    # --- password reset ----------------------------------------------------

    async def forgot_password(self, email: str) -> ForgotPasswordResponse:
        user = (
            await self.session.execute(select(User).where(User.email == email.lower()))
        ).scalar_one_or_none()
        if user is None:
            return ForgotPasswordResponse(ok=True)

        raw = secrets.token_urlsafe(32)
        self.session.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=_hash_token(raw),
                expires_at=datetime.now(UTC) + timedelta(hours=1),
            )
        )
        log.info("password reset requested user=%s", user.id)
        # TODO: send `raw` by email. Returned inline only outside production.
        return ForgotPasswordResponse(ok=True, reset_token=None if settings.is_production else raw)

    async def reset_password(self, data: ResetPasswordRequest) -> None:
        row = (
            await self.session.execute(
                select(PasswordResetToken).where(
                    PasswordResetToken.token_hash == _hash_token(data.token)
                )
            )
        ).scalar_one_or_none()
        now = datetime.now(UTC)
        if row is None or row.used_at is not None or row.expires_at < now:
            raise AuthError("This reset link is invalid or has expired.")

        user = await self._get(User, row.user_id, label="User")
        user.password_hash = hash_password(data.password)
        row.used_at = now
        # Revoke every active session for this user.
        for s in (
            await self.session.execute(
                select(RefreshSession).where(
                    RefreshSession.user_id == user.id,
                    RefreshSession.revoked_at.is_(None),
                )
            )
        ).scalars():
            s.revoked_at = now

    # --- helpers ---------------------------------------------------------

    async def _issue_session(
        self, user: User, *, user_agent: str | None, ip: str | None
    ) -> SessionResponse:
        access = create_token(str(user.id), "access", role=user.role.value)
        refresh = create_token(str(user.id), "refresh")
        self.session.add(
            RefreshSession(
                user_id=user.id,
                token_hash=_hash_token(refresh),
                user_agent=(user_agent or "")[:400] or None,
                ip=ip,
                expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_ttl_days),
            )
        )
        return SessionResponse(
            user=UserRead.model_validate(user),
            access_token=access,
            refresh_token=refresh,
            expires_in=settings.access_token_ttl_minutes * 60,
        )


def get_auth_service(session: AsyncSession = Depends(db_session)) -> AuthService:
    return AuthService(session)
