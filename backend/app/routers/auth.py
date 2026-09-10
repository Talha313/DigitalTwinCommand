from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response

from app.core.config import settings
from app.dependencies import current_user
from app.db.models.user import User
from app.models.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    ResetPasswordRequest,
    SessionResponse,
    SignupRequest,
    UserRead,
)
from app.services.auth import AuthService, get_auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

_ACCESS_MAX_AGE = settings.access_token_ttl_minutes * 60
_REFRESH_MAX_AGE = settings.refresh_token_ttl_days * 86400
_REFRESH_COOKIE = f"{settings.auth_cookie_name}_refresh"


def _set_cookies(response: Response, session: SessionResponse) -> None:
    common = {
        "httponly": True,
        "secure": settings.auth_cookie_secure,
        "samesite": "lax",
        "path": "/",
    }
    response.set_cookie(
        settings.auth_cookie_name, session.access_token, max_age=_ACCESS_MAX_AGE, **common
    )
    response.set_cookie(
        _REFRESH_COOKIE, session.refresh_token, max_age=_REFRESH_MAX_AGE, **common
    )


def _clear_cookies(response: Response) -> None:
    response.delete_cookie(settings.auth_cookie_name, path="/")
    response.delete_cookie(_REFRESH_COOKIE, path="/")


def _client_meta(request: Request) -> dict[str, str | None]:
    return {
        "user_agent": request.headers.get("user-agent"),
        "ip": request.client.host if request.client else None,
    }


@router.post("/signup", response_model=SessionResponse, status_code=201)
async def signup(
    body: SignupRequest,
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> SessionResponse:
    session = await service.signup(body, **_client_meta(request))
    _set_cookies(response, session)
    return session


@router.post("/login", response_model=SessionResponse)
async def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> SessionResponse:
    session = await service.login(body, **_client_meta(request))
    _set_cookies(response, session)
    return session


@router.post("/refresh", response_model=SessionResponse)
async def refresh(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> SessionResponse:
    token = request.cookies.get(_REFRESH_COOKIE) or ""
    if not token:
        body = await _safe_json(request)
        token = body.get("refresh_token", "")
    session = await service.refresh(token, **_client_meta(request))
    _set_cookies(response, session)
    return session


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
) -> Response:
    await service.logout(request.cookies.get(_REFRESH_COOKIE))
    _clear_cookies(response)
    return Response(status_code=204)


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(current_user)) -> UserRead:
    return UserRead.model_validate(user)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    body: ForgotPasswordRequest, service: AuthService = Depends(get_auth_service)
) -> ForgotPasswordResponse:
    return await service.forgot_password(body.email)


@router.post("/reset-password", status_code=204)
async def reset_password(
    body: ResetPasswordRequest, service: AuthService = Depends(get_auth_service)
) -> Response:
    await service.reset_password(body)
    return Response(status_code=204)


async def _safe_json(request: Request) -> dict:
    try:
        return await request.json()
    except Exception:  # noqa: BLE001
        return {}
