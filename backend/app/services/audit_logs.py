from __future__ import annotations

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.audit_log import AuditLog
from app.db.session import session_scope
from app.dependencies import db_session
from app.models.audit_logs import AuditLogRead
from app.services.base import Service, as_uuid


class AuditLogService(Service):
    async def list_logs(
        self,
        user_id: str | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        *,
        limit: int = 200,
    ) -> list[AuditLogRead]:
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        if user_id:
            stmt = stmt.where(AuditLog.user_id == as_uuid(user_id))
        if entity_type:
            stmt = stmt.where(AuditLog.entity_type == entity_type)
        if entity_id:
            stmt = stmt.where(AuditLog.entity_id == as_uuid(entity_id))
        rows = (await self.session.execute(stmt)).scalars().all()
        return [AuditLogRead.model_validate(r) for r in rows]

    async def get(self, log_id: str) -> AuditLogRead:
        return AuditLogRead.model_validate(await self._get(AuditLog, log_id, label="Audit log"))


async def record(
    action: str,
    *,
    user_id: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    meta: dict | None = None,
) -> None:
    """Fire-and-forget audit entry on its own transaction."""
    async with session_scope() as session:
        session.add(
            AuditLog(
                user_id=as_uuid(user_id) if user_id else None,
                action=action,
                entity_type=entity_type,
                entity_id=as_uuid(entity_id) if entity_id else None,
                meta=meta,
            )
        )


def get_audit_logs_service(
    session: AsyncSession = Depends(db_session),
) -> AuditLogService:
    return AuditLogService(session)
