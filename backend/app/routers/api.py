"""Router aggregation.

``api_router``    -> business endpoints, mounted under ``/api``.
``openai_router`` -> OpenAI-compatible endpoint, mounted at the root.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.routers import (
    audit_logs,
    auth,
    calls,
    chat,
    conversations,
    grades,
    health,
    integrations,
    memories,
    reports,
    roles,
    whispers,
)

api_router = APIRouter(prefix="/api")
for _module in (
    health,
    auth,
    roles,
    conversations,
    calls,
    whispers,
    reports,
    integrations,
    memories,
    grades,
    audit_logs,
):
    api_router.include_router(_module.router)

openai_router = APIRouter()
openai_router.include_router(chat.router)
