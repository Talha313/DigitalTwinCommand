"""Idempotent seed data: baseline permissions, tools, AI roles, integration
rows, and (optionally) a bootstrap admin user."""

from __future__ import annotations

from sqlalchemy import select

from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import hash_password
from app.db.models.enums import (
    IntegrationStatus,
    RiskLevel,
    UserRole,
    UserStatus,
)
from app.db.models.integration import Integration
from app.db.models.role import Permission, Role, RolePermission, RoleTool, Tool
from app.db.models.user import User
from app.db.session import session_scope

log = get_logger(__name__)

_PERMISSIONS = [
    ("portfolio.read", "View portfolio positions and balances"),
    ("portfolio.trade", "Place or modify trades"),
    ("calendar.read", "Read the calendar"),
    ("calendar.write", "Create or change calendar events"),
    ("message.send", "Send messages / emails on Howie's behalf"),
    ("report.generate", "Trigger the daily market report"),
    ("workflow.execute", "Run automated workflows"),
    ("contact.read", "Look up contact details"),
]

_TOOLS = [
    ("market_search", "internal", "Search live market data and news"),
    ("web_search", "xai", "General web search"),
    ("calendar", "google", "Google Calendar read/write"),
    ("crm_lookup", "internal", "Look up a caller in the CRM"),
    ("send_email", "internal", "Compose and send an email"),
]

_ROLES = [
    {
        "name": "Market Analyst",
        "description": "Talks markets, reads the tape, frames the day for a normal investor.",
        "tone": "sharp, plain-spoken",
        "risk_level": RiskLevel.LOW,
        "personality": {
            "summary": "Confident about the tape, humble about forecasts.",
            "traits": ["direct", "numerate", "calm"],
        },
        "permissions": ["portfolio.read", "report.generate", "calendar.read"],
        "tools": ["market_search", "web_search"],
    },
    {
        "name": "Client Relations",
        "description": "Handles inbound calls warmly, books follow-ups, never over-promises.",
        "tone": "warm, efficient",
        "risk_level": RiskLevel.MEDIUM,
        "personality": {
            "summary": "Makes the caller feel heard, then moves to the next step.",
            "traits": ["personable", "organised"],
        },
        "permissions": ["calendar.write", "message.send", "contact.read"],
        "tools": ["calendar", "crm_lookup", "send_email"],
    },
    {
        "name": "Executive Assistant",
        "description": "Runs the schedule, triages requests, executes routine workflows.",
        "tone": "crisp, proactive",
        "risk_level": RiskLevel.HIGH,
        "personality": {
            "summary": "Anticipates the need before it is asked.",
            "traits": ["decisive", "thorough"],
        },
        "permissions": ["calendar.write", "message.send", "workflow.execute", "contact.read"],
        "tools": ["calendar", "send_email", "crm_lookup"],
    },
]

_INTEGRATIONS = [
    ("xAI (Grok)", "xai", "ai_engine"),
    ("ElevenLabs", "elevenlabs", "voice"),
    ("Twilio", "twilio", "telephony"),
    ("HeyGen / D-ID", "lipsync", "video"),
    ("Object storage (S3)", "s3", "storage"),
    ("Web push", "push", "notifications"),
]


async def seed() -> None:
    async with session_scope() as session:
        perms = await _upsert_named(session, Permission, _PERMISSIONS)
        tools = await _upsert_named(session, Tool, _TOOLS, has_provider=True)

        for spec in _ROLES:
            role = (
                await session.execute(select(Role).where(Role.name == spec["name"]))
            ).scalar_one_or_none()
            if role is None:
                role = Role(
                    name=spec["name"],
                    description=spec["description"],
                    tone=spec["tone"],
                    risk_level=spec["risk_level"],
                    personality=spec["personality"],
                    is_active=True,
                )
                session.add(role)
                await session.flush()
                for pname in spec["permissions"]:
                    if pname in perms:
                        session.add(RolePermission(role_id=role.id, permission_id=perms[pname]))
                for tname in spec["tools"]:
                    if tname in tools:
                        session.add(RoleTool(role_id=role.id, tool_id=tools[tname], enabled=True))

        for name, provider, kind in _INTEGRATIONS:
            exists = (
                await session.execute(
                    select(Integration.id).where(Integration.provider == provider)
                )
            ).first()
            if exists is None:
                session.add(
                    Integration(
                        name=name,
                        provider=provider,
                        type=kind,
                        status=IntegrationStatus.DISABLED,
                    )
                )

        if settings.bootstrap_admin_password:
            admin = (
                await session.execute(
                    select(User).where(User.email == settings.bootstrap_admin_email.lower())
                )
            ).scalar_one_or_none()
            if admin is None:
                session.add(
                    User(
                        email=settings.bootstrap_admin_email.lower(),
                        password_hash=hash_password(settings.bootstrap_admin_password),
                        first_name="Admin",
                        role=UserRole.ADMIN,
                        status=UserStatus.ACTIVE,
                    )
                )
                log.info("bootstrap admin created: %s", settings.bootstrap_admin_email)

    log.info("seed complete")


async def _upsert_named(session, model, rows, *, has_provider: bool = False) -> dict:
    out: dict[str, object] = {}
    for row in rows:
        name = row[0]
        obj = (await session.execute(select(model).where(model.name == name))).scalar_one_or_none()
        if obj is None:
            kwargs = {"name": name, "description": row[-1]}
            if has_provider:
                kwargs["provider"] = row[1]
            obj = model(**kwargs)
            session.add(obj)
            await session.flush()
        out[name] = obj.id
    return out
