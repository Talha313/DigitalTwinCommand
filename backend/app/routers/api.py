"""Router aggregation.

``api_router``    -> business endpoints, mounted under ``/api``
``webhook_router`` -> Twilio / ElevenLabs webhooks + media WS, mounted at root
``ws_router``     -> PWA realtime WebSocket, mounted at root
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
    media,
    memories,
    notifications,
    push,
    reports,
    roles,
    telephony,
    users,
    webhooks,
    whispers,
    ws,
)

api_router = APIRouter(prefix="/api")
for _module in (
    health,
    auth,
    users,
    roles,
    conversations,
    chat,
    calls,
    whispers,
    reports,
    integrations,
    memories,
    grades,
    audit_logs,
    push,
    notifications,
):
    api_router.include_router(_module.router)

webhook_router = APIRouter()
webhook_router.include_router(telephony.router)
webhook_router.include_router(webhooks.router)
webhook_router.include_router(media.router)

ws_router = APIRouter()
ws_router.include_router(ws.router)
