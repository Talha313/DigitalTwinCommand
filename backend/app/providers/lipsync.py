"""Avatar / lip-sync video generation. Pluggable provider — HeyGen or D-ID —
both consume the ElevenLabs PVC audio file and Howie's still photo."""
from __future__ import annotations

import asyncio
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import NotConfiguredError, UpstreamError
from app.providers.http import shared_client

log = get_logger(__name__)


class LipSyncClient:
    @property
    def provider(self) -> str:
        return settings.lipsync_provider.lower()

    @property
    def configured(self) -> bool:
        if self.provider == "heygen":
            return bool(settings.lipsync_api_key and settings.heygen_avatar_id)
        if self.provider == "did":
            return bool(settings.lipsync_api_key and settings.did_source_url)
        return False

    async def render(self, *, audio_url: str, aspect: str) -> str:
        """Submit a job and poll until a downloadable MP4 URL is ready."""
        if not self.configured:
            raise NotConfiguredError(
                f"Lip-sync provider {self.provider!r} is not fully configured."
            )
        if self.provider == "heygen":
            return await self._heygen(audio_url=audio_url, aspect=aspect)
        if self.provider == "did":
            return await self._did(audio_url=audio_url)
        raise NotConfiguredError(f"Unknown lipsync provider {self.provider!r}")

    # --- HeyGen --------------------------------------------------------

    async def _heygen(self, *, audio_url: str, aspect: str) -> str:
        w, h = (720, 1280) if aspect == "9x16" else (1280, 720)
        headers = {"X-Api-Key": settings.lipsync_api_key}
        body = {
            "video_inputs": [
                {
                    "character": {
                        "type": "avatar",
                        "avatar_id": settings.heygen_avatar_id,
                        "avatar_style": "normal",
                    },
                    "voice": {"type": "audio", "audio_url": audio_url},
                }
            ],
            "dimension": {"width": w, "height": h},
        }
        try:
            resp = await shared_client().post(
                "https://api.heygen.com/v2/video/generate", headers=headers, json=body
            )
            resp.raise_for_status()
            video_id = resp.json()["data"]["video_id"]
        except (httpx.HTTPError, KeyError) as exc:
            raise UpstreamError(f"HeyGen submit failed: {exc}") from exc

        for _ in range(120):  # ~20 min max
            await asyncio.sleep(10)
            try:
                s = await shared_client().get(
                    "https://api.heygen.com/v1/video_status.get",
                    params={"video_id": video_id},
                    headers=headers,
                )
                s.raise_for_status()
                data = s.json()["data"]
            except (httpx.HTTPError, KeyError) as exc:
                raise UpstreamError(f"HeyGen poll failed: {exc}") from exc
            if data["status"] == "completed":
                return data["video_url"]
            if data["status"] in {"failed", "error"}:
                raise UpstreamError(f"HeyGen render failed: {data.get('error')}")
        raise UpstreamError("HeyGen render timed out.")

    # --- D-ID ---------------------------------------------------------

    async def _did(self, *, audio_url: str) -> str:
        auth = (settings.lipsync_api_key, "")
        try:
            resp = await shared_client().post(
                "https://api.d-id.com/talks",
                auth=auth,
                json={
                    "source_url": settings.did_source_url,
                    "script": {"type": "audio", "audio_url": audio_url},
                },
            )
            resp.raise_for_status()
            talk_id = resp.json()["id"]
        except (httpx.HTTPError, KeyError) as exc:
            raise UpstreamError(f"D-ID submit failed: {exc}") from exc

        for _ in range(120):
            await asyncio.sleep(10)
            g = await shared_client().get(f"https://api.d-id.com/talks/{talk_id}", auth=auth)
            g.raise_for_status()
            data: dict[str, Any] = g.json()
            if data.get("status") == "done":
                return data["result_url"]
            if data.get("status") == "error":
                raise UpstreamError(f"D-ID render failed: {data.get('error')}")
        raise UpstreamError("D-ID render timed out.")


lipsync_client = LipSyncClient()
