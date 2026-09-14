"""Avatar / lip-sync video generation.

heygen | did          — fully automated: submit a job, poll for the MP4.
elevenlabs            — automated via the Flows Video API's `creatify-aurora`
                         model (general-availability as of 2026), which takes
                         a raw photo + audio and produces a lip-synced video.
                         NOT the same as ElevenLabs "Avatars" (the persistent
                         named avatar built in the app, e.g. the one at
                         elevenlabs.io/app/image-video?...) — that feature's
                         own docs still say "API access: not available at
                         launch." Flows Video takes a plain photo each call,
                         not an avatar_id, so it can't reference that avatar
                         by identity — only reuse the same source photo.
                         Falls back to the AWAITING_AVATAR manual-upload flow
                         (report_pipeline.render()) if unconfigured.
"""

from __future__ import annotations

import asyncio
import base64
import mimetypes
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import NotConfiguredError, UpstreamError
from app.providers.http import shared_client
from app.providers.storage import local_path, storage

log = get_logger(__name__)

_ELEVEN_API = "https://api.elevenlabs.io/v1"


class LipSyncClient:
    @property
    def provider(self) -> str:
        return settings.lipsync_provider_norm

    @property
    def automated(self) -> bool:
        """True when a report video can be produced without a human step."""
        return self.provider in {"heygen", "did", "elevenlabs"} and self.configured

    @property
    def configured(self) -> bool:
        if self.provider == "elevenlabs":
            # did_source_url doubles as "the reference photo" for both
            # providers — it's just a public photo of Howie either way.
            return bool(settings.elevenlabs_api_key and settings.did_source_url)
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
        if self.provider == "elevenlabs":
            return await self._elevenlabs(audio_url=audio_url)
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

    # --- ElevenLabs (Flows Video, creatify-aurora) ----------------------

    async def _elevenlabs(self, *, audio_url: str) -> str:
        """No aspect_ratio param exists for this model — the output inherits
        the source photo's own aspect, same as _did() above ignoring
        `aspect` today. The per-aspect 16:9/9:16 crop happens in ffmpeg
        packaging downstream, not here."""
        headers = {"xi-api-key": settings.elevenlabs_api_key}
        image_b64, image_mime = await self._fetch_b64(settings.did_source_url)
        audio_b64, audio_mime = await self._fetch_b64(audio_url)

        try:
            # Same reasoning as _fetch_b64's timeout: the base64-inlined
            # audio pushes this request body to ~10-15MB, which the shared
            # client's default 30s timeout isn't enough to even upload.
            resp = await shared_client().post(
                f"{_ELEVEN_API}/flows/video",
                headers=headers,
                json={
                    "model_id": "creatify-aurora",
                    "image": {
                        "type": "inline_base64",
                        "content_base64": image_b64,
                        "mime_type": image_mime,
                    },
                    "audio": {
                        "type": "inline_base64",
                        "content_base64": audio_b64,
                        "mime_type": audio_mime,
                    },
                    "resolution": "720p",
                },
                timeout=httpx.Timeout(180.0, connect=15.0),
            )
            resp.raise_for_status()
            generation_id = resp.json()["id"]
        except (httpx.HTTPError, KeyError) as exc:
            raise UpstreamError(f"ElevenLabs video submit failed: {exc}") from exc

        for _ in range(120):  # ~20 min max
            await asyncio.sleep(10)
            try:
                s = await shared_client().get(
                    f"{_ELEVEN_API}/flows/video/{generation_id}", headers=headers
                )
                s.raise_for_status()
                data = s.json()
            except httpx.HTTPError as exc:
                raise UpstreamError(f"ElevenLabs video poll failed: {exc}") from exc
            status = data.get("status")
            if status == "completed":
                return data["content_url"]
            if status == "failed":
                raise UpstreamError(
                    f"ElevenLabs video render failed: {data.get('failure_reason')} "
                    f"{data.get('error_message', '')}"
                )
        raise UpstreamError("ElevenLabs video render timed out.")

    @staticmethod
    async def _fetch_b64(url: str) -> tuple[str, str]:
        # When this URL is our own local-storage media route, read the file
        # straight off disk instead of round-tripping through the public dev
        # tunnel — a multi-MB file over a free ngrok tunnel has been observed
        # dropping mid-transfer (not a timeout — the peer just closes the
        # connection a few % from the end). S3-backed / external URLs still
        # go over HTTP below, with a generous timeout for the same reason.
        prefix = f"{settings.public_base}/media/"
        if storage.backend == "local" and url.startswith(prefix):
            key = url[len(prefix) :]
            path = local_path(key)
            try:
                content = await asyncio.to_thread(path.read_bytes)
            except OSError as exc:
                raise UpstreamError(f"Failed to read local media {key!r}: {exc}") from exc
            mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            return base64.b64encode(content).decode(), mime

        try:
            resp = await shared_client().get(url, timeout=httpx.Timeout(180.0, connect=15.0))
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"Failed to fetch {url} for ElevenLabs video: {exc}") from exc
        mime = resp.headers.get("content-type", "application/octet-stream").split(";")[0]
        return base64.b64encode(resp.content).decode(), mime

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
