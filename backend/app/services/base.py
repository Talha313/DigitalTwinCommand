from __future__ import annotations

import uuid
from typing import Any, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.errors import NotFoundError

ModelT = TypeVar("ModelT", bound=Base)


def as_uuid(value: str | uuid.UUID, *, field: str = "id") -> uuid.UUID:
    if isinstance(value, uuid.UUID):
        return value
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError) as exc:
        raise NotFoundError(f"Invalid {field}: {value!r}") from exc


class Service:
    """Base service. Holds the request/worker session and generic helpers."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _get(
        self,
        model: type[ModelT],
        obj_id: str | uuid.UUID,
        *,
        options: list[Any] | None = None,
        label: str | None = None,
    ) -> ModelT:
        stmt = select(model).where(model.id == as_uuid(obj_id))  # type: ignore[attr-defined]
        for opt in options or []:
            stmt = stmt.options(opt)
        obj = (await self.session.execute(stmt)).scalar_one_or_none()
        if obj is None:
            raise NotFoundError(f"{label or model.__name__} {obj_id} not found")
        return obj

    async def _get_or_none(
        self, model: type[ModelT], obj_id: str | uuid.UUID, *, options: list[Any] | None = None
    ) -> ModelT | None:
        try:
            return await self._get(model, obj_id, options=options)
        except NotFoundError:
            return None
