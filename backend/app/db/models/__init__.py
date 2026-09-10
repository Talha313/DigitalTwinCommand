"""SQLAlchemy ORM models. Importing this package registers every table on
``Base.metadata`` (used by Alembic autogenerate)."""

from app.db.models.audit_log import AuditLog
from app.db.models.call import Call, CallRole
from app.db.models.conversation import Conversation
from app.db.models.grade import Grade
from app.db.models.integration import Integration
from app.db.models.memory import Memory
from app.db.models.message import Message
from app.db.models.report import Report, ReportJob
from app.db.models.role import (
    Permission,
    Role,
    RolePermission,
    RoleTool,
    Tool,
    conversation_roles,
)
from app.db.models.user import User
from app.db.models.utterance import Utterance
from app.db.models.whisper import Whisper

__all__ = [
    "AuditLog",
    "Call",
    "CallRole",
    "Conversation",
    "Grade",
    "Integration",
    "Memory",
    "Message",
    "Permission",
    "Report",
    "ReportJob",
    "Role",
    "RolePermission",
    "RoleTool",
    "Tool",
    "User",
    "Utterance",
    "Whisper",
    "conversation_roles",
]
