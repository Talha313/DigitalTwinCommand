from __future__ import annotations

from datetime import UTC, datetime

from fastapi import Depends
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.db.models.push import PushSubscription
from app.db.session import session_scope
from app.dependencies import db_session
from app.models.push import PushSubscribeRequest
from app.providers.push import push_client
from app.services.base import Service, as_uuid

log = get_logger(__name__)


class PushService(Service):
    async def subscribe(self, data: PushSubscribeRequest, *, user_id: str) -> None:
        stmt = (
            insert(PushSubscription)
            .values(
                user_id=as_uuid(user_id),
                endpoint=data.endpoint,
                keys=data.keys.model_dump(),
                user_agent=data.user_agent,
            )
            .on_conflict_do_update(
                index_elements=["endpoint"],
                set_={"user_id": as_uuid(user_id), "keys": data.keys.model_dump()},
            )
        )
        await self.session.execute(stmt)

    async def unsubscribe(self, endpoint: str) -> None:
        await self.session.execute(
            delete(PushSubscription).where(PushSubscription.endpoint == endpoint)
        )


async def notify_users(user_ids: list[str], payload: dict) -> None:
    """Deliver a push payload to every subscription of the given users."""
    if not push_client.configured or not user_ids:
        return
    async with session_scope() as session:
        subs = (
            await session.execute(
                select(PushSubscription).where(
                    PushSubscription.user_id.in_([as_uuid(u) for u in user_ids])
                )
            )
        ).scalars().all()
        stale: list[str] = []
        for sub in subs:
            alive = await push_client.send(
                {"endpoint": sub.endpoint, "keys": sub.keys}, payload
            )
            if alive:
                sub.last_used_at = datetime.now(UTC)
            else:
                stale.append(sub.endpoint)
        if stale:
            await session.execute(
                delete(PushSubscription).where(PushSubscription.endpoint.in_(stale))
            )


async def notify_all(payload: dict) -> None:
    if not push_client.configured:
        return
    async with session_scope() as session:
        subs = (await session.execute(select(PushSubscription))).scalars().all()
        for sub in subs:
            await push_client.send({"endpoint": sub.endpoint, "keys": sub.keys}, payload)


def get_push_service(session: AsyncSession = Depends(db_session)) -> PushService:
    return PushService(session)
