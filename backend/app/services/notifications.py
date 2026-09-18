from __future__ import annotations

from datetime import UTC, datetime

from fastapi import Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.notification import Notification
from app.db.session import session_scope
from app.dependencies import db_session
from app.errors import NotFoundError
from app.models.notifications import NotificationRead
from app.services.base import Service, as_uuid


class NotificationService(Service):
    async def list_for_user(self, user_id: str, *, limit: int = 50) -> list[NotificationRead]:
        rows = (
            (
                await self.session.execute(
                    select(Notification)
                    .where(Notification.user_id == as_uuid(user_id))
                    .order_by(Notification.created_at.desc())
                    .limit(limit)
                )
            )
            .scalars()
            .all()
        )
        return [NotificationRead.model_validate(r) for r in rows]

    async def mark_read(self, notification_id: str, *, user_id: str) -> NotificationRead:
        notif = await self._get(Notification, notification_id, label="Notification")
        if str(notif.user_id) != user_id:
            raise NotFoundError("Notification not found")
        if notif.read_at is None:
            notif.read_at = datetime.now(UTC)
        await self.session.flush()
        return NotificationRead.model_validate(notif)

    async def mark_all_read(self, user_id: str) -> None:
        await self.session.execute(
            update(Notification)
            .where(Notification.user_id == as_uuid(user_id), Notification.read_at.is_(None))
            .values(read_at=datetime.now(UTC))
        )


def get_notifications_service(
    session: AsyncSession = Depends(db_session),
) -> NotificationService:
    return NotificationService(session)


async def create_notifications(
    user_ids: list[str],
    *,
    title: str,
    body: str | None = None,
    url: str | None = None,
    tag: str | None = None,
) -> None:
    """Bulk-write one notification row per user — call this alongside
    notify_users() (Web Push) so the in-app bell and push stay in sync."""
    if not user_ids:
        return
    async with session_scope() as session:
        for uid in user_ids:
            session.add(
                Notification(
                    user_id=as_uuid(uid),
                    title=title,
                    body=body,
                    url=url,
                    tag=tag,
                )
            )
