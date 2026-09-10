from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models.auth import LoginRequest, SessionResponse
from app.services.auth import AuthService, get_auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=SessionResponse)
async def login(
    body: LoginRequest, service: AuthService = Depends(get_auth_service)
) -> SessionResponse:
    return await service.login(body)
