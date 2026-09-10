from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    status_code = 400
    code = "app_error"

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        code: str | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"


class AuthError(AppError):
    status_code = 401
    code = "unauthorized"


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"


class UpstreamError(AppError):
    """A third-party provider (Twilio / ElevenLabs / Anthropic / ...) failed."""

    status_code = 502
    code = "upstream_error"


class NotConfiguredError(AppError):
    """A required integration credential is missing."""

    status_code = 503
    code = "not_configured"


class NotImplementedYet(AppError):
    status_code = 501
    code = "not_implemented"


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )
