"""Integrations — configured third-party services (Twilio, ElevenLabs, xAI, ...)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin
from app.db.models.enums import IntegrationStatus


class Integration(UUIDMixin, Base):
    __tablename__ = "integrations"

    name: Mapped[str] = mapped_column(String(120))
    provider: Mapped[str] = mapped_column(String(120))
    type: Mapped[str | None] = mapped_column(String(60))
    status: Mapped[IntegrationStatus] = mapped_column(
        Enum(IntegrationStatus, name="integration_status"),
        default=IntegrationStatus.DISABLED,
    )
    configuration: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
