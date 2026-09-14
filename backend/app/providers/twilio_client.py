"""Twilio Programmable Voice. Outbound calls stream media to our bridge over a
Twilio <Stream>; the bridge relays to the ElevenLabs agent."""

from __future__ import annotations

from typing import Any
from xml.sax.saxutils import escape

import httpx
from twilio.request_validator import RequestValidator

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import NotConfiguredError, UpstreamError
from app.providers.http import shared_client

log = get_logger(__name__)

_API = "https://api.twilio.com/2010-04-01"


class TwilioClient:
    @property
    def configured(self) -> bool:
        return bool(
            settings.twilio_account_sid
            and settings.twilio_auth_token
            and settings.twilio_phone_number
        )

    def _auth(self) -> tuple[str, str]:
        if not self.configured:
            raise NotConfiguredError("Twilio credentials are not fully configured.")
        return (settings.twilio_account_sid, settings.twilio_auth_token)

    # --- calls -----------------------------------------------------------

    async def create_call(
        self, *, to: str, answer_url: str, status_callback: str
    ) -> dict[str, Any]:
        sid, token = self._auth()
        try:
            resp = await shared_client().post(
                f"{_API}/Accounts/{sid}/Calls.json",
                auth=(sid, token),
                data={
                    "To": to,
                    "From": settings.twilio_phone_number,
                    "Url": answer_url,
                    "StatusCallback": status_callback,
                    "StatusCallbackEvent": ["initiated", "ringing", "answered", "completed"],
                    "MachineDetection": "Enable",
                },
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"Twilio create call failed: {exc}") from exc
        return resp.json()

    async def update_call(self, call_sid: str, **data: Any) -> dict[str, Any]:
        sid, token = self._auth()
        try:
            resp = await shared_client().post(
                f"{_API}/Accounts/{sid}/Calls/{call_sid}.json",
                auth=(sid, token),
                data={k: v for k, v in data.items() if v is not None},
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"Twilio update call failed: {exc}") from exc
        return resp.json()

    async def hangup(self, call_sid: str) -> None:
        await self.update_call(call_sid, Status="completed")

    async def start_recording(self, call_sid: str, **data: Any) -> dict[str, Any]:
        """Record an in-progress call. This is its own sub-resource — unlike
        Status/Url, `Record`/`RecordingChannels`/`RecordingStatusCallback` are
        NOT recognized fields on the Update-a-Call endpoint above; Twilio just
        silently no-ops there (200 OK, no error, no recording)."""
        sid, token = self._auth()
        try:
            resp = await shared_client().post(
                f"{_API}/Accounts/{sid}/Calls/{call_sid}/Recordings.json",
                auth=(sid, token),
                data={k: v for k, v in data.items() if v is not None},
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"Twilio start recording failed: {exc}") from exc
        return resp.json()

    async def redirect_to_hold(self, call_sid: str, hold_url: str) -> None:
        await self.update_call(call_sid, Url=hold_url, Method="POST")

    async def delete_recording(self, recording_url: str) -> None:
        """recording_url is the Recordings resource URL (RecordingUrl from
        Twilio's callback) — its last path segment is the RecordingSid."""
        sid, token = self._auth()
        recording_sid = recording_url.rstrip("/").rsplit("/", 1)[-1]
        try:
            resp = await shared_client().delete(
                f"{_API}/Accounts/{sid}/Recordings/{recording_sid}.json", auth=(sid, token)
            )
            if resp.status_code not in (204, 404):
                resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"Twilio delete recording failed: {exc}") from exc

    async def fetch_recording(self, recording_url: str) -> tuple[bytes, str]:
        """Recording media URLs are Twilio API resources, not public files —
        they need the same account SID/auth token Basic Auth as every other
        Twilio API call, plus a format extension Twilio doesn't include by
        default. Call recordings are short, so buffering the whole file
        (rather than a true streaming proxy) is simplest."""
        sid, token = self._auth()
        url = recording_url if recording_url.endswith((".mp3", ".wav")) else f"{recording_url}.mp3"
        try:
            resp = await shared_client().get(url, auth=(sid, token))
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"Twilio recording fetch failed: {exc}") from exc
        return resp.content, resp.headers.get("content-type", "audio/mpeg")

    # --- TwiML ---------------------------------------------------------

    @staticmethod
    def stream_twiml(stream_url: str, *, call_id: str) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response><Connect>"
            f'<Stream url="{escape(stream_url)}">'
            f'<Parameter name="call_id" value="{escape(call_id)}"/>'
            "</Stream></Connect></Response>"
        )

    @staticmethod
    def hold_twiml(*, loop: int = 0) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8"?>'
            f'<Response><Play loop="{loop}">'
            "https://api.twilio.com/cowbell.mp3"
            "</Play></Response>"
        )

    # --- webhook validation -------------------------------------------

    @staticmethod
    def validate_signature(url: str, params: dict[str, str], signature: str | None) -> bool:
        if not settings.twilio_validate_signatures:
            return True
        if not settings.twilio_auth_token or not signature:
            return False
        validator = RequestValidator(settings.twilio_auth_token)
        return validator.validate(url, params, signature)


twilio_client = TwilioClient()
