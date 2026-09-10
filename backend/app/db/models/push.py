"""Web-push subscriptions registered by installed PWAs."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin


class PushSubscription(UUIDMixin, Base):
    __tablename__ = "push_subscriptions"
    __table_args__ = (UniqueConstraint("endpoint", name="uq_push_endpoint"),)

    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    endpoint: Mapped[str] = mapped_column(Text)
    keys: Mapped[dict] = mapped_column(JSONB)  # {"p256dh": ..., "auth": ...}
    user_agent: Mapped[str | None] = mapped_column(String(400))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
