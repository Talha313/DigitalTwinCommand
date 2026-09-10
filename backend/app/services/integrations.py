from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import db_session
from app.errors import NotImplementedYet
from app.models.integrations import (
    ConnectionTestResult,
    IntegrationCreate,
    IntegrationRead,
    IntegrationUpdate,
)
from app.services.base import Service


class IntegrationService(Service):
    async def list_integrations(self) -> list[IntegrationRead]:
        raise NotImplementedYet("Integrations are not implemented yet.")

    async def get(self, integration_id: str) -> IntegrationRead:
        raise NotImplementedYet("Integrations are not implemented yet.")

    async def create(self, data: IntegrationCreate) -> IntegrationRead:
        raise NotImplementedYet("Integrations are not implemented yet.")

    async def update(
        self, integration_id: str, data: IntegrationUpdate
    ) -> IntegrationRead:
        raise NotImplementedYet("Integrations are not implemented yet.")

    async def test_connection(self, integration_id: str) -> ConnectionTestResult:
        raise NotImplementedYet("Connection testing is not implemented yet.")


def get_integrations_service(
    session: AsyncSession = Depends(db_session),
) -> IntegrationService:
    return IntegrationService(session)
