from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    # --- core -----------------------------------------------------------------
    environment: str = "development"
    debug: bool = True
    database_url: str = "postgresql+asyncpg://dtcc:dtcc@localhost:5432/dtcc"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: str = "http://localhost:3000,http://localhost:3001"
    public_host: str = "http://localhost:8000"
    public_ws_host: str = ""  # defaults to public_host with ws scheme
    echo_sql: bool = False

    # --- auth ---------------------------------------------------------------
    session_secret: str = "change-me-in-production-this-must-be-long-and-random"
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 30
    auth_cookie_name: str = "dtcc_session"
    auth_cookie_secure: bool = False  # True behind HTTPS
    bootstrap_admin_email: str = "admin@example.com"
    bootstrap_admin_password: str = ""  # if set, an admin user is created on startup

    # --- LLM (Anthropic direct — used for /chat, report research, grading) ---
    # The live *phone* agent's LLM is Claude hosted natively by ElevenLabs and
    # is configured in the ElevenLabs dashboard, not here.
    anthropic_api_key: str = ""
    anthropic_chat_model: str = "claude-sonnet-5"
    anthropic_report_model: str = "claude-opus-5"
    anthropic_grader_model: str = "claude-haiku-4-5-20251001"
    anthropic_max_tokens: int = 4096

    # --- ElevenLabs -------------------------------------------------------------
    elevenlabs_api_key: str = ""
    elevenlabs_agent_id: str = ""
    elevenlabs_voice_id: str = ""  # Professional Voice Clone — never a stock voice
    elevenlabs_webhook_secret: str = ""  # HMAC secret for post-call webhooks
    elevenlabs_llm_label: str = "elevenlabs/claude-haiku-4.5"  # informational only

    # --- Twilio --------------------------------------------------------------
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""  # E.164, the imported number
    twilio_validate_signatures: bool = True

    # --- Avatar / lip sync ---------------------------------------------------
    lipsync_provider: str = "heygen"  # heygen | did | elevenlabs
    lipsync_api_key: str = ""
    heygen_avatar_id: str = ""
    did_source_url: str = ""  # public URL of Howie's photo for D-ID

    # --- Storage (S3 / MinIO compatible) -----------------------------------
    s3_bucket: str = ""
    s3_region: str = "us-east-1"
    s3_endpoint_url: str = ""  # set for MinIO / non-AWS
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_public_base_url: str = ""  # CDN / public bucket base; else presigned URLs

    # --- Web push (VAPID) --------------------------------------------------
    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_subject: str = "mailto:ops@example.com"

    # --- Reports -----------------------------------------------------------
    report_tz: str = "America/New_York"
    report_cron_hour: int = 5
    report_cron_minute: int = 30
    report_approval_required: bool = True
    ffmpeg_bin: str = "ffmpeg"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def ws_host(self) -> str:
        if self.public_ws_host:
            return self.public_ws_host
        return self.public_host.replace("http://", "ws://").replace("https://", "wss://")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
