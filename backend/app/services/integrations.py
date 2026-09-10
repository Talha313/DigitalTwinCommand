from __future__ import annotations

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models.enums import IntegrationStatus
from app.db.models.integration import Integration
from app.dependencies import db_session
from app.models.integrations import (
    ConnectionTestResult,
    IntegrationCreate,
    IntegrationRead,
    IntegrationUpdate,
)
from app.providers.anthropic_client import anthropic_client
from app.providers.elevenlabs import elevenlabs_client
from app.providers.lipsync import lipsync_client
from app.providers.push import push_client
from app.providers.storage import storage
from app.providers.twilio_client import twilio_client
from app.services.base import Service

log = get_logger(__name__)


async def _probe(provider: str) -> tuple[bool, str]:
    p = provider.lower()
    try:
        if p == "twilio":
            if not twilio_client.configured:
                return False, "Missing account SID / auth token / phone number."
            return True, f"Ready · {settings.twilio_phone_number}"
        if p == "elevenlabs":
            if not elevenlabs_client.configured:
                return False, "ELEVENLABS_API_KEY is not set."
            acct = await elevenlabs_client.account()
            tier = acct.get("tier", "active")
            agent = " · agent set" if elevenlabs_client.agent_configured else " · no agent id"
            return True, f"Connected · {tier}{agent}"
        if p in {"anthropic", "claude"}:
            return (
                (True, f"Key present · {settings.anthropic_chat_model}")
                if anthropic_client.configured
                else (False, "ANTHROPIC_API_KEY is not set.")
            )
        if p in {"heygen", "did", "lipsync"}:
            return (
                (True, f"Ready · {lipsync_client.provider}")
                if lipsync_client.configured
                else (False, f"{lipsync_client.provider} not fully configured.")
            )
        if p in {"s3", "aws", "storage"}:
            if not storage.configured:
                return False, "No bucket configured."
            ok = await storage.health()
            return (ok, "Bucket reachable." if ok else "Bucket not reachable.")
        if p in {"push", "webpush"}:
            return (
                (True, "VAPID keys present.")
                if push_client.configured
                else (False, "VAPID keys are not configured.")
            )
    except Exception as exc:
        return False, f"{exc}"
    return False, "No connection test for this provider."


class IntegrationService(Service):
    async def list_integrations(self) -> list[IntegrationRead]:
        rows = (
            (await self.session.execute(select(Integration).order_by(Integration.name)))
            .scalars()
            .all()
        )
        return [IntegrationRead.model_validate(r) for r in rows]

    async def get(self, integration_id: str) -> IntegrationRead:
        return IntegrationRead.model_validate(
            await self._get(Integration, integration_id, label="Integration")
        )

    async def create(self, data: IntegrationCreate) -> IntegrationRead:
        row = Integration(
            name=data.name,
            provider=data.provider,
            type=data.type,
            status=data.status,
            configuration=data.configuration,
        )
        self.session.add(row)
        await self.session.flush()
        return IntegrationRead.model_validate(row)

    async def update(self, integration_id: str, data: IntegrationUpdate) -> IntegrationRead:
        row = await self._get(Integration, integration_id, label="Integration")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(row, field, value)
        await self.session.flush()
        return IntegrationRead.model_validate(row)

    async def test_connection(self, integration_id: str) -> ConnectionTestResult:
        row = await self._get(Integration, integration_id, label="Integration")
        ok, detail = await _probe(row.provider)
        row.status = IntegrationStatus.CONNECTED if ok else IntegrationStatus.ERROR
        await self.session.flush()
        return ConnectionTestResult(ok=ok, status=row.status, detail=detail)


def get_integrations_service(
    session: AsyncSession = Depends(db_session),
) -> IntegrationService:
    return IntegrationService(session)
