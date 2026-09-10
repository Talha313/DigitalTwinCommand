from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.models.audit_logs import AuditLogRead
from app.services.audit_logs import AuditLogService, get_audit_logs_service

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogRead])
async def list_audit_logs(
    user_id: str | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    entity_id: str | None = Query(default=None),
    service: AuditLogService = Depends(get_audit_logs_service),
) -> list[AuditLogRead]:
    return await service.list_logs(user_id, entity_type, entity_id)


@router.get("/{log_id}", response_model=AuditLogRead)
async def get_audit_log(
    log_id: str, service: AuditLogService = Depends(get_audit_logs_service)
) -> AuditLogRead:
    return await service.get(log_id)
