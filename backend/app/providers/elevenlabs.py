"""ElevenLabs — Agents platform (Twilio phone agent) + long-form TTS for the
daily report. The agent's LLM (Claude) is configured in the ElevenLabs
dashboard; we only orchestrate audio, transcript and whisper injection."""

from __future__ import annotations

import asyncio
import hashlib
import hmac
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import NotConfiguredError, UpstreamError
from app.providers.http import shared_client

log = get_logger(__name__)

_BASE = "https://api.elevenlabs.io"


class ElevenLabsClient:
    @property
    def configured(self) -> bool:
        return bool(settings.elevenlabs_api_key)

    @property
    def agent_configured(self) -> bool:
        return bool(settings.elevenlabs_api_key and settings.elevenlabs_agent_id)

    def _headers(self) -> dict[str, str]:
        if not self.configured:
            raise NotConfiguredError("ELEVENLABS_API_KEY is not set.")
        return {"xi-api-key": settings.elevenlabs_api_key}


    async def get_signed_url(self, agent_id: str | None = None) -> str:
        """Signed WSS URL to open a conversation with a (possibly private) agent."""
        agent = agent_id or settings.elevenlabs_agent_id
        if not agent:
            raise NotConfiguredError("ELEVENLABS_AGENT_ID is not set.")
        try:
            resp = await shared_client().get(
                f"{_BASE}/v1/convai/conversation/get-signed-url",
                params={"agent_id": agent},
                headers=self._headers(),
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"ElevenLabs signed-url failed: {exc}") from exc
        return resp.json()["signed_url"]

    async def get_conversation(self, conversation_id: str) -> dict[str, Any]:
        try:
            resp = await shared_client().get(
                f"{_BASE}/v1/convai/conversations/{conversation_id}",
                headers=self._headers(),
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"ElevenLabs conversation fetch failed: {exc}") from exc
        return resp.json()

    async def account(self) -> dict[str, Any]:
        resp = await shared_client().get(f"{_BASE}/v1/user", headers=self._headers())
        resp.raise_for_status()
        return resp.json()

    async def agent(self, agent_id: str | None = None) -> dict[str, Any]:
        agent = agent_id or settings.elevenlabs_agent_id
        resp = await shared_client().get(
            f"{_BASE}/v1/convai/agents/{agent}", headers=self._headers()
        )
        resp.raise_for_status()
        return resp.json()


    async def tts(
        self,
        text: str,
        *,
        voice_id: str | None = None,
        model_id: str = "eleven_multilingual_v2",
        output_format: str = "mp3_44100_128",
    ) -> bytes:
        voice = voice_id or settings.elevenlabs_voice_id
        if not voice:
            raise NotConfiguredError("ELEVENLABS_VOICE_ID (Professional Voice Clone) is not set.")
        # A report's script is synthesized as several chunks (report_pipeline
        # ._chunk_script) — a one-off network blip on any single chunk used
        # to abort the whole render (this has now been observed in practice).
        # Retry transient connection errors a few times before giving up;
        # a real API error (bad request, rate limit, etc.) still fails fast.
        last_exc: httpx.TransportError | None = None
        for attempt in range(3):
            if attempt:
                await asyncio.sleep(2 * attempt)
            try:
                resp = await shared_client().post(
                    f"{_BASE}/v1/text-to-speech/{voice}",
                    params={"output_format": output_format},
                    headers={**self._headers(), "accept": "audio/mpeg"},
                    json={
                        "text": text,
                        "model_id": model_id,
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.8,
                            "style": 0.0,
                            "use_speaker_boost": True,
                        },
                    },
                    timeout=httpx.Timeout(180.0, connect=10.0),
                )
                resp.raise_for_status()
            except httpx.TransportError as exc:
                last_exc = exc
                log.warning("ElevenLabs TTS network error (attempt %d/3), retrying: %s", attempt + 1, exc)
                continue
            except httpx.HTTPError as exc:
                raise UpstreamError(f"ElevenLabs TTS failed: {exc}") from exc
            return resp.content
        raise UpstreamError(f"ElevenLabs TTS failed after 3 attempts: {last_exc}") from last_exc


    @staticmethod
    def verify_webhook(payload: bytes, signature_header: str | None) -> bool:
        secret = settings.elevenlabs_webhook_secret
        if not secret:
            return not settings.is_production
        if not signature_header:
            return False
        parts = dict(p.split("=", 1) for p in signature_header.split(",") if "=" in p)
        ts, sig = parts.get("t"), parts.get("v0")
        if not ts or not sig:
            return False
        expected = hmac.new(
            secret.encode(), f"{ts}.".encode() + payload, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, sig)


elevenlabs_client = ElevenLabsClient()
