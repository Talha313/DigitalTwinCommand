from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import db_session
from app.errors import NotImplementedYet
from app.models.audit_logs import AuditLogRead
from app.services.base import Service


class AuditLogService(Service):
    async def list_logs(
        self,
        user_id: str | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
    ) -> list[AuditLogRead]:
        raise NotImplementedYet("Audit logs are not implemented yet.")

    async def get(self, log_id: str) -> AuditLogRead:
        raise NotImplementedYet("Audit logs are not implemented yet.")


def get_audit_logs_service(
    session: AsyncSession = Depends(db_session),
) -> AuditLogService:
    return AuditLogService(session)
