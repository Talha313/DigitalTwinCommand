from __future__ import annotations

from datetime import datetime

from app.models.base import ORMModel


class NotificationRead(ORMModel):
    id: str
    title: str
    body: str | None = None
    url: str | None = None
    tag: str | None = None
    read_at: datetime | None = None
    created_at: datetime
