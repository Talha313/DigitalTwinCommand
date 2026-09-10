"""Whispers — operator guidance injected into the Twin's next turn on a call."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin
from app.db.models.enums import WhisperKind, WhisperStatus

if TYPE_CHECKING:
    from app.db.models.call import Call


class Whisper(UUIDMixin, Base):
    __tablename__ = "whispers"

    call_id: Mapped[str] = mapped_column(
        ForeignKey("calls.id", ondelete="CASCADE"), index=True
    )
    text: Mapped[str] = mapped_column(Text)
    kind: Mapped[WhisperKind] = mapped_column(
        Enum(WhisperKind, name="whisper_kind"),
        default=WhisperKind.CONTEXTUAL_UPDATE,
    )
    status: Mapped[WhisperStatus] = mapped_column(
        Enum(WhisperStatus, name="whisper_status"), default=WhisperStatus.QUEUED
    )
    created_by: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    injected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    spoken_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    used_in_training: Mapped[bool] = mapped_column(Boolean, default=False)

    call: Mapped[Call] = relationship(back_populates="whispers")
