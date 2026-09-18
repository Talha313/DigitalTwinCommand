from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


class UserStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class CallDirection(StrEnum):
    INCOMING = "incoming"
    OUTGOING = "outgoing"


class CallStatus(StrEnum):
    QUEUED = "queued"
    RINGING = "ringing"
    IN_PROGRESS = "in_progress"
    CONNECTED = "connected"
    COMPLETED = "completed"
    FAILED = "failed"
    NO_ANSWER = "no_answer"
    CANCELED = "canceled"


class CallOutcome(StrEnum):
    WON = "won"
    LOST = "lost"
    FOLLOW_UP = "follow_up"
    JUNK = "junk"


class UtteranceSpeaker(StrEnum):
    CALLER = "caller"
    TWIN = "twin"
    WHISPER = "whisper"


class UtteranceSource(StrEnum):
    TWILIO = "twilio"
    ELEVENLABS = "elevenlabs"
    LLM = "llm"
    OPERATOR = "operator"


class WhisperStatus(StrEnum):
    QUEUED = "queued"
    INJECTED = "injected"
    SPOKEN = "spoken"
    FAILED = "failed"


class WhisperKind(StrEnum):
    """How the whisper is delivered to the ElevenLabs conversation."""

    CONTEXTUAL_UPDATE = "contextual_update"
    USER_MESSAGE = "user_message"


class IntegrationStatus(StrEnum):
    CONNECTED = "connected"
    ERROR = "error"
    DISABLED = "disabled"


class ReportStatus(StrEnum):
    QUEUED = "queued"
    RESEARCHING = "researching"
    SCRIPT_READY = "script_ready"
    APPROVED = "approved"
    GENERATING = "generating"
    AWAITING_AVATAR = "awaiting_avatar"
    READY = "ready"
    FAILED = "failed"


class ReportStage(StrEnum):
    RESEARCH = "research"
    SCRIPT = "script"
    VOICE = "voice"
    AVATAR = "avatar"
    PROCESSING = "processing"
    UPLOAD = "upload"


class ReportJobStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class MemorySourceType(StrEnum):
    CHAT = "chat"
    CALL = "call"
    WHISPER = "whisper"
    DOCUMENT = "document"


class MemoryStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
