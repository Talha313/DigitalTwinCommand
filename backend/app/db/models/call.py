"""Call-related tables: calls and the call_roles mapping."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin
from app.db.models.enums import CallDirection, CallOutcome, CallStatus

if TYPE_CHECKING:
    from app.db.models.utterance import Utterance
    from app.db.models.whisper import Whisper


class Call(UUIDMixin, Base):
    __tablename__ = "calls"

    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    twilio_sid: Mapped[str | None] = mapped_column(String(64), unique=True)
    eleven_conversation_id: Mapped[str | None] = mapped_column(String(64), unique=True)

    direction: Mapped[CallDirection] = mapped_column(
        Enum(CallDirection, name="call_direction")
    )
    from_e164: Mapped[str | None] = mapped_column(String(20))
    to_e164: Mapped[str | None] = mapped_column(String(20))

    status: Mapped[CallStatus] = mapped_column(
        Enum(CallStatus, name="call_status"), default=CallStatus.RINGING
    )
    outcome: Mapped[CallOutcome | None] = mapped_column(
        Enum(CallOutcome, name="call_outcome")
    )
    recording_url: Mapped[str | None] = mapped_column(Text)
    recording_consent: Mapped[bool] = mapped_column(Boolean, default=False)

    # Denormalised review metadata (filled when the call ends).
    model: Mapped[str | None] = mapped_column(String(120))
    summary: Mapped[str | None] = mapped_column(Text)
    tool_call_count: Mapped[int] = mapped_column(Integer, default=0)
    cost_cents: Mapped[int | None] = mapped_column(Integer)

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), index=True
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    utterances: Mapped[list[Utterance]] = relationship(
        back_populates="call", order_by="Utterance.timestamp"
    )
    whispers: Mapped[list[Whisper]] = relationship(back_populates="call")


class CallRole(UUIDMixin, Base):
    """Role assigned to a call (call_roles). E.g. call #123 -> Financial Twin, Operator Twin."""

    __tablename__ = "call_roles"
    __table_args__ = (UniqueConstraint("call_id", "role_id", name="uq_call_role"),)

    call_id: Mapped[str] = mapped_column(
        ForeignKey("calls.id", ondelete="CASCADE"), index=True
    )
    role_id: Mapped[str] = mapped_column(
        ForeignKey("ai_roles.id", ondelete="CASCADE"), index=True
    )
