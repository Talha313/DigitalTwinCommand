from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine
from app.models.common import HealthResponse
from app.providers.anthropic_client import anthropic_client
from app.providers.elevenlabs import elevenlabs_client
from app.providers.lipsync import lipsync_client
from app.providers.push import push_client
from app.providers.storage import storage
from app.providers.twilio_client import twilio_client

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    db_ok = True
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return HealthResponse(
        status="ok" if db_ok else "degraded",
        environment=settings.environment,
        call_llm=settings.elevenlabs_llm_label,
        chat_llm=settings.anthropic_chat_model,
        database=db_ok,
        lipsync=f"{lipsync_client.provider}"
        + ("" if lipsync_client.automated else " (manual upload)"),
        storage=storage.backend,
        integrations={
            "anthropic": anthropic_client.configured,
            "elevenlabs": elevenlabs_client.configured,
            "elevenlabs_agent": elevenlabs_client.agent_configured,
            "twilio": twilio_client.configured,
            "lipsync": lipsync_client.configured,
            "storage": await storage.health(),
            "push": push_client.configured,
        },
    )
