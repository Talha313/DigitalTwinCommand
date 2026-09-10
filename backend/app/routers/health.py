from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.models.common import HealthResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", model=settings.xai_model)
