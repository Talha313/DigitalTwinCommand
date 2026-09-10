"""All role-related tables: ai_roles, permissions, tools, and the
role_permissions / role_tools mapping tables."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.db.models.enums import RiskLevel


class Permission(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "permissions"

    # Dotted identifier, e.g. "portfolio.read", "workflow.execute",
    # "message.send", "report.generate".
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)

    roles: Mapped[list[Role]] = relationship(
        secondary="role_permissions", back_populates="permissions"
    )


class Tool(UUIDMixin, TimestampMixin, Base):
    """A tool / API the Digital Twin can be granted access to."""

    __tablename__ = "tools"

    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    provider: Mapped[str | None] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)

    roles: Mapped[list[Role]] = relationship(secondary="role_tools", back_populates="tools")


class Role(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "ai_roles"

    name: Mapped[str] = mapped_column(String(120), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    personality: Mapped[dict | None] = mapped_column(JSONB)
    tone: Mapped[str | None] = mapped_column(String(120))
    risk_level: Mapped[RiskLevel] = mapped_column(
        Enum(RiskLevel, name="risk_level"), default=RiskLevel.MEDIUM
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    permissions: Mapped[list[Permission]] = relationship(
        secondary="role_permissions", back_populates="roles"
    )
    tools: Mapped[list[Tool]] = relationship(secondary="role_tools", back_populates="roles")


class RolePermission(UUIDMixin, Base):
    """Role ↔ Permission mapping."""

    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),)

    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ai_roles.id", ondelete="CASCADE"), index=True
    )
    permission_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RoleTool(UUIDMixin, Base):
    """Role ↔ Tool / API access grant."""

    __tablename__ = "role_tools"
    __table_args__ = (UniqueConstraint("role_id", "tool_id", name="uq_role_tool"),)

    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ai_roles.id", ondelete="CASCADE"), index=True
    )
    tool_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tools.id", ondelete="CASCADE"), index=True
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


# Role assignment to a conversation (call_roles is a mapped model — see call.py).

conversation_roles = Table(
    "conversation_roles",
    Base.metadata,
    Column(
        "conversation_id",
        ForeignKey("conversations.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("role_id", ForeignKey("ai_roles.id", ondelete="CASCADE"), primary_key=True),
)
