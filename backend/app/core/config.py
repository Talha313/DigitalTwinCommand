from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    environment: str = "development"
    debug: bool = True
    database_url: str = "postgresql+asyncpg://dtcc:dtcc@localhost:5432/dtcc"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: str = "http://localhost:3000,http://localhost:3001"
    public_host: str = "http://localhost:8000"
    public_ws_host: str = ""
    echo_sql: bool = False

    session_secret: str = "change-me-in-production-this-must-be-long-and-random"
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 30
    auth_cookie_name: str = "dtcc_session"
    auth_cookie_secure: bool = False
    bootstrap_admin_email: str = "admin@example.com"
    bootstrap_admin_password: str = ""

    xai_api_key: str = ""
    xai_model: str = "grok-4.6"

    anthropic_api_key: str = ""
    anthropic_chat_model: str = "claude-sonnet-5"
    anthropic_report_model: str = "claude-opus-5"
    anthropic_grader_model: str = "claude-haiku-4-5-20251001"
    anthropic_max_tokens: int = 4096

    elevenlabs_api_key: str = ""
    elevenlabs_agent_id: str = ""
    elevenlabs_voice_id: str = ""
    elevenlabs_webhook_secret: str = ""
    elevenlabs_llm_label: str = "elevenlabs/claude-haiku-4.5"

    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    twilio_validate_signatures: bool = True

    lipsync_provider: str = "heygen"
    lipsync_api_key: str = ""
    heygen_avatar_id: str = ""
    did_source_url: str = ""

    storage_dir: str = "var/storage"
    s3_bucket: str = ""
    s3_region: str = "us-east-1"
    s3_endpoint_url: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_public_base_url: str = ""

    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_subject: str = "mailto:ops@example.com"

    report_tz: str = "America/New_York"
    report_cron_hour: int = 5
    report_cron_minute: int = 30
    report_approval_required: bool = True
    ffmpeg_bin: str = "ffmpeg"

    retention_days: int = 30

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def public_base(self) -> str:
        """The externally reachable base URL (what Twilio / ElevenLabs call).
        Tolerates a comma-separated PUBLIC_HOST by preferring an https entry."""
        parts = [p.strip().rstrip("/") for p in self.public_host.split(",") if p.strip()]
        if not parts:
            return "http://localhost:8000"
        https = [p for p in parts if p.startswith("https://")]
        return (https or parts)[0]

    @property
    def ws_host(self) -> str:
        if self.public_ws_host:
            return self.public_ws_host.rstrip("/")
        return self.public_base.replace("https://", "wss://").replace("http://", "ws://")

    @property
    def lipsync_provider_norm(self) -> str:
        """First real provider token from LIPSYNC_PROVIDER (tolerates the
        'elevenlabs|did|heygen' placeholder from .env.example)."""
        raw = self.lipsync_provider.strip().lower()
        for token in raw.replace(",", "|").split("|"):
            token = token.strip()
            if token in {"elevenlabs", "did", "heygen"}:
                return token
        return "elevenlabs"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
