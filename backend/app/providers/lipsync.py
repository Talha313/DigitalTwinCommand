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
                         Creatify Aurora hard-caps audio at 5 minutes per call
                         (a real ~10 min daily-report script 400s with
                         audio_duration_exceeded) — _elevenlabs() splits the
                         audio into <=270s segments, renders each separately
                         against the same photo, and stitches the resulting
                         clips back into one MP4 with ffmpeg concat.
"""

from __future__ import annotations

import asyncio
import base64
import mimetypes
import tempfile
import uuid
from pathlib import Path
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import NotConfiguredError, UpstreamError
from app.providers.http import shared_client
from app.providers.storage import key_from_url, local_path, storage

log = get_logger(__name__)

_ELEVEN_API = "https://api.elevenlabs.io/v1"
_MAX_SEGMENT_SECONDS = 270  # Creatify Aurora's hard cap is 300s — leave margin


class LipSyncClient:
    def __init__(self) -> None:
        # did/elevenlabs both ignore `aspect` (same photo + full audio either
        # way — the 16:9/9:16 crop happens in ffmpeg packaging downstream),
        # so report_pipeline.render() calling render() once per aspect would
        # otherwise submit and pay for the identical video twice.
        self._last_audio_url: str | None = None
        self._last_video_url: str | None = None

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
        if self.provider in {"did", "elevenlabs"}:
            if self._last_audio_url == audio_url and self._last_video_url:
                return self._last_video_url
            video_url = (
                await self._did(audio_url=audio_url)
                if self.provider == "did"
                else await self._elevenlabs(audio_url=audio_url)
            )
            self._last_audio_url, self._last_video_url = audio_url, video_url
            return video_url
        raise NotConfiguredError(f"Unknown lipsync provider {self.provider!r}")


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

        for _ in range(120):
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


    async def _elevenlabs(self, *, audio_url: str) -> str:
        """No aspect_ratio param exists for this model — the output inherits
        the source photo's own aspect (the per-aspect 16:9/9:16 crop happens
        in ffmpeg packaging downstream, not here). Creatify Aurora also caps
        audio at 5 minutes per call, so a full ~10 min report script is split
        into <=_MAX_SEGMENT_SECONDS chunks, each rendered against the same
        photo, then stitched back into one MP4.

        Each segment costs real money (~229k ElevenLabs credits for a 270s
        clip) — a retry after a later segment fails must not re-render an
        earlier one that already succeeded. audio_url comes from a stable,
        per-report storage key (report_pipeline._report_key), so segment i's
        result is cached under a sibling key derived from that same prefix
        and reused on the next attempt instead of re-submitted."""
        headers = {"xi-api-key": settings.elevenlabs_api_key}
        image_b64, image_mime = await self._fetch_b64(settings.did_source_url)
        audio_bytes, _audio_mime = await self._fetch_bytes(audio_url)

        src_key = key_from_url(audio_url)
        base_key = src_key.rsplit("/", 1)[0] if src_key else None

        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            audio_path = d / "audio_in.mp3"
            audio_path.write_bytes(audio_bytes)
            duration = await self._ffprobe_duration(audio_path)

            if duration <= _MAX_SEGMENT_SECONDS:
                segment_paths = [audio_path]
            else:
                segment_paths = await self._split_audio(audio_path, d)

            video_paths: list[Path] = []
            for i, seg_path in enumerate(segment_paths):
                cache_key = f"{base_key}/lipsync_seg{i:03d}.mp4" if base_key else None
                if cache_key and await storage.exists(cache_key):
                    log.info("lipsync segment %d already rendered — reusing cached result", i)
                    video_bytes = await self._download(await storage.url_for(cache_key))
                else:
                    seg_b64 = base64.b64encode(seg_path.read_bytes()).decode()
                    content_url = await self._submit_and_poll_flows(
                        headers=headers,
                        image_b64=image_b64,
                        image_mime=image_mime,
                        audio_b64=seg_b64,
                    )
                    video_bytes = await self._download(content_url)
                    if cache_key:
                        await storage.put(cache_key, video_bytes, content_type="video/mp4")
                video_path = d / f"seg{i:03d}.mp4"
                video_path.write_bytes(video_bytes)
                video_paths.append(video_path)

            final_bytes = (
                video_paths[0].read_bytes()
                if len(video_paths) == 1
                else await self._concat_videos(video_paths, d)
            )

        key = f"lipsync/{uuid.uuid4()}.mp4"
        return await storage.put(key, final_bytes, content_type="video/mp4")

    async def _submit_and_poll_flows(
        self, *, headers: dict[str, str], image_b64: str, image_mime: str, audio_b64: str
    ) -> str:
        # ElevenLabs' 401 is overloaded: it covers both a genuine transient
        # gateway blip (a retry moments later with the same key/payload has
        # sailed through as a 200) AND a deterministic "quota_exceeded" body
        # (account out of monthly credits) that raise_for_status()'s default
        # message hides — it just says "401 Unauthorized" either way. Always
        # surface the real response body so the two aren't confused again,
        # and don't burn 3 retries re-uploading a multi-MB payload against a
        # quota that won't refill mid-request.
        last_exc: Exception | None = None
        for attempt in range(3):
            if attempt:
                await asyncio.sleep(2 * attempt)
            try:
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
                            "mime_type": "audio/mpeg",
                        },
                        "resolution": "720p",
                    },
                    timeout=httpx.Timeout(180.0, connect=15.0),
                )
                resp.raise_for_status()
                generation_id = resp.json()["id"]
                break
            except httpx.TransportError as exc:
                last_exc = exc
                log.warning("ElevenLabs video submit network error (attempt %d/3), retrying: %s", attempt + 1, exc)
                continue
            except httpx.HTTPStatusError as exc:
                try:
                    body = exc.response.json()
                except ValueError:
                    body = exc.response.text
                code = body.get("detail", {}).get("code") if isinstance(body, dict) else None
                if code in {"quota_exceeded", "paid_plan_required", "moderated"}:
                    raise UpstreamError(f"ElevenLabs video submit failed: {exc} — {body}") from exc
                last_exc = exc
                if exc.response.status_code in (401, 429) or exc.response.status_code >= 500:
                    log.warning("ElevenLabs video submit %s (attempt %d/3), retrying: %s", exc.response.status_code, attempt + 1, body)
                    continue
                raise UpstreamError(f"ElevenLabs video submit failed: {exc} — {body}") from exc
            except (httpx.HTTPError, KeyError) as exc:
                raise UpstreamError(f"ElevenLabs video submit failed: {exc}") from exc
        else:
            raise UpstreamError(f"ElevenLabs video submit failed after 3 attempts: {last_exc}") from last_exc

        # Measured against the real API: a single ~270s (near-max-length)
        # segment took ~29 minutes to render — the previous 20-minute cap
        # (120 * 10s) was too tight and killed a generation that was going
        # to succeed. 45 minutes (270 * 10s) leaves real margin per segment.
        # This loop makes up to 270 individual HTTP requests over that
        # window, so a one-off network blip (a ConnectTimeout has already
        # been observed killing an otherwise-succeeding render) is treated
        # as "not ready yet" and retried rather than aborting the whole
        # segment — only a real response from ElevenLabs (a status code, or
        # valid JSON) ends the loop early.
        for _ in range(270):
            await asyncio.sleep(10)
            try:
                s = await shared_client().get(
                    f"{_ELEVEN_API}/flows/video/{generation_id}", headers=headers
                )
                s.raise_for_status()
                data = s.json()
            except httpx.TransportError as exc:
                log.warning("ElevenLabs video poll network error, retrying: %s", exc)
                continue
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
    def _ffprobe_bin() -> str:
        ff = settings.ffmpeg_bin
        return str(Path(ff).with_name("ffprobe")) if "/" in ff or "\\" in ff else "ffprobe"

    @classmethod
    async def _ffprobe_duration(cls, path: Path) -> float:
        proc = await asyncio.create_subprocess_exec(
            cls._ffprobe_bin(),
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        out, err = await proc.communicate()
        if proc.returncode != 0:
            raise UpstreamError(f"ffprobe failed: {err.decode()[-400:]}")
        return float(out.decode().strip())

    @staticmethod
    async def _split_audio(audio_path: Path, tmp_dir: Path) -> list[Path]:
        pattern = tmp_dir / "part%03d.mp3"
        proc = await asyncio.create_subprocess_exec(
            settings.ffmpeg_bin,
            "-y",
            "-i", str(audio_path),
            "-f", "segment",
            "-segment_time", str(_MAX_SEGMENT_SECONDS),
            "-c", "copy",
            "-reset_timestamps", "1",
            str(pattern),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            raise UpstreamError(f"ffmpeg audio split failed: {stderr.decode()[-400:]}")
        parts = sorted(tmp_dir.glob("part*.mp3"))
        if not parts:
            raise UpstreamError("ffmpeg produced no audio segments.")
        return parts

    @staticmethod
    async def _concat_videos(paths: list[Path], tmp_dir: Path) -> bytes:
        list_path = tmp_dir / "concat_list.txt"
        list_path.write_text("\n".join(f"file '{p.as_posix()}'" for p in paths))
        out_path = tmp_dir / "concat_out.mp4"
        proc = await asyncio.create_subprocess_exec(
            settings.ffmpeg_bin,
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(list_path),
            "-c", "copy",
            str(out_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            raise UpstreamError(f"ffmpeg video concat failed: {stderr.decode()[-400:]}")
        return out_path.read_bytes()

    @staticmethod
    async def _download(url: str) -> bytes:
        try:
            resp = await shared_client().get(url, timeout=httpx.Timeout(300.0, connect=15.0))
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"Failed to download {url}: {exc}") from exc
        return resp.content

    @staticmethod
    async def _fetch_bytes(url: str) -> tuple[bytes, str]:
        prefix = f"{settings.public_base}/media/"
        if storage.backend == "local" and url.startswith(prefix):
            key = url[len(prefix) :]
            path = local_path(key)
            try:
                content = await asyncio.to_thread(path.read_bytes)
            except OSError as exc:
                raise UpstreamError(f"Failed to read local media {key!r}: {exc}") from exc
            mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            return content, mime

        try:
            resp = await shared_client().get(url, timeout=httpx.Timeout(180.0, connect=15.0))
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"Failed to fetch {url} for ElevenLabs video: {exc}") from exc
        mime = resp.headers.get("content-type", "application/octet-stream").split(";")[0]
        return resp.content, mime

    @classmethod
    async def _fetch_b64(cls, url: str) -> tuple[str, str]:
        content, mime = await cls._fetch_bytes(url)
        return base64.b64encode(content).decode(), mime


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
