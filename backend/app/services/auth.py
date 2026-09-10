from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import db_session
from app.errors import NotImplementedYet
from app.services.base import Service

from app.models.auth import LoginRequest, SessionResponse


class AuthService(Service):
    async def login(self, data: LoginRequest) -> SessionResponse:
        raise NotImplementedYet("Authentication is not implemented yet.")



def get_auth_service(session: AsyncSession = Depends(db_session)) -> AuthService:
    return AuthService(session)
