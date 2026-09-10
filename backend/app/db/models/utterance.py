"""Utterances — the live-call transcript (one row per final utterance)."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin
from app.db.models.enums import UtteranceSource, UtteranceSpeaker

if TYPE_CHECKING:
    from app.db.models.call import Call


class Utterance(UUIDMixin, Base):
    __tablename__ = "utterances"

    call_id: Mapped[str] = mapped_column(
        ForeignKey("calls.id", ondelete="CASCADE"), index=True
    )
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    speaker: Mapped[UtteranceSpeaker] = mapped_column(
        Enum(UtteranceSpeaker, name="utterance_speaker")
    )
    text: Mapped[str] = mapped_column(Text)
    source: Mapped[UtteranceSource | None] = mapped_column(
        Enum(UtteranceSource, name="utterance_source")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    call: Mapped[Call] = relationship(back_populates="utterances")
