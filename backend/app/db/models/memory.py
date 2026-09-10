"""Memories — the knowledge store / future-training data collected from the
platform (chats, calls, whispers, documents)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin
from app.db.models.enums import MemorySourceType, MemoryStatus


class Memory(UUIDMixin, Base):
    __tablename__ = "memories"

    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    content: Mapped[str] = mapped_column(Text)
    source_type: Mapped[MemorySourceType] = mapped_column(
        Enum(MemorySourceType, name="memory_source_type")
    )
    confidence: Mapped[float | None] = mapped_column(Float)
    status: Mapped[MemoryStatus] = mapped_column(
        Enum(MemoryStatus, name="memory_status"), default=MemoryStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
