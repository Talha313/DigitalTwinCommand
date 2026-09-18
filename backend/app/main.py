from __future__ import annotations

import contextlib
from collections.abc import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.core.ratelimit import limiter
from app.errors import AppError, app_error_handler
from app.providers.http import close_shared_client
from app.routers.api import api_router, webhook_router, ws_router
from app.worker.queue import close_pool

log = get_logger(__name__)


@contextlib.asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    log.info("starting DTCC API · env=%s", settings.environment)
    if settings.bootstrap_admin_password or not settings.is_production:
        with contextlib.suppress(Exception):
            from app.db.seed import seed

            await seed()
    yield
    await close_shared_client()
    await close_pool()
    log.info("shutdown complete")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Digital Twin Command Center API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.state.limiter = limiter
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppError, app_error_handler)

    @app.exception_handler(RequestValidationError)
    async def _validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Request validation failed.",
                    "details": exc.errors(),
                }
            },
        )

    @app.exception_handler(RateLimitExceeded)
    async def _ratelimit_handler(_: Request, exc: RateLimitExceeded) -> JSONResponse:
        return JSONResponse(
            status_code=429,
            content={
                "error": {"code": "rate_limited", "message": f"Rate limit exceeded: {exc.detail}"}
            },
        )

    app.include_router(api_router)
    app.include_router(webhook_router)
    app.include_router(webhook_router, prefix="/api")
    app.include_router(ws_router)
    return app


app = create_app()
