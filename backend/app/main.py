from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.errors import AppError, app_error_handler
from app.routers.api import api_router, openai_router


def create_app() -> FastAPI:
    app = FastAPI(title="Digital Twin Command Center API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_exception_handler(AppError, app_error_handler)

    app.include_router(api_router)
    app.include_router(openai_router)
    return app


app = create_app()
