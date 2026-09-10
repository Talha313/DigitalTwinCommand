from __future__ import annotations

from fastapi import APIRouter, Depends

from app.db.models.enums import UserRole
from app.db.models.user import User
from app.dependencies import current_user, require_role
from app.models.integrations import (
    ConnectionTestResult,
    IntegrationCreate,
    IntegrationRead,
    IntegrationUpdate,
)
from app.services.integrations import IntegrationService, get_integrations_service

router = APIRouter(prefix="/integrations", tags=["integrations"])

_admin = require_role(UserRole.ADMIN)


@router.get("", response_model=list[IntegrationRead])
async def list_integrations(
    _: User = Depends(current_user),
    service: IntegrationService = Depends(get_integrations_service),
) -> list[IntegrationRead]:
    return await service.list_integrations()


@router.post("", response_model=IntegrationRead, status_code=201)
async def create_integration(
    body: IntegrationCreate,
    _: User = Depends(_admin),
    service: IntegrationService = Depends(get_integrations_service),
) -> IntegrationRead:
    return await service.create(body)


@router.get("/{integration_id}", response_model=IntegrationRead)
async def get_integration(
    integration_id: str,
    _: User = Depends(current_user),
    service: IntegrationService = Depends(get_integrations_service),
) -> IntegrationRead:
    return await service.get(integration_id)


@router.patch("/{integration_id}", response_model=IntegrationRead)
async def update_integration(
    integration_id: str,
    body: IntegrationUpdate,
    _: User = Depends(_admin),
    service: IntegrationService = Depends(get_integrations_service),
) -> IntegrationRead:
    return await service.update(integration_id, body)


@router.post("/{integration_id}/test", response_model=ConnectionTestResult)
async def test_integration(
    integration_id: str,
    _: User = Depends(_admin),
    service: IntegrationService = Depends(get_integrations_service),
) -> ConnectionTestResult:
    return await service.test_connection(integration_id)
