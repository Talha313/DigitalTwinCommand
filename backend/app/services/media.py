"""ffmpeg post-processing for the daily report: burn captions, loudness-
normalise, and export 1080p 16:9 + 9:16."""

from __future__ import annotations

import asyncio
import shutil
import tempfile
from pathlib import Path

import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import UpstreamError
from app.providers.http import shared_client

log = get_logger(__name__)


def ffmpeg_available() -> bool:
    return shutil.which(settings.ffmpeg_bin) is not None


async def _run(*args: str) -> None:
    proc = await asyncio.create_subprocess_exec(
        settings.ffmpeg_bin,
        "-y",
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise UpstreamError(f"ffmpeg failed: {stderr.decode()[-800:]}")


async def _download(url: str, dest: Path) -> None:
    async with shared_client().stream("GET", url, timeout=httpx.Timeout(300.0)) as r:
        r.raise_for_status()
        with dest.open("wb") as fh:
            async for chunk in r.aiter_bytes():
                fh.write(chunk)


async def concat_audio(chunks: list[bytes]) -> bytes:
    """Stitch multiple MP3 buffers (e.g. per-chunk TTS output, see
    report_pipeline._chunk_script) into one file. Falls back to raw byte
    concatenation when ffmpeg isn't installed — same-codec/bitrate MP3 frames
    from a single TTS voice splice cleanly enough for narration audio."""
    if len(chunks) == 1:
        return chunks[0]
    if not ffmpeg_available():
        return b"".join(chunks)
    with tempfile.TemporaryDirectory() as tmp:
        d = Path(tmp)
        list_path = d / "list.txt"
        lines = []
        for i, chunk in enumerate(chunks):
            part = d / f"part{i}.mp3"
            part.write_bytes(chunk)
            lines.append(f"file '{part.as_posix()}'")
        list_path.write_text("\n".join(lines))
        out = d / "out.mp3"
        await _run(
            "-f", "concat", "-safe", "0", "-i", list_path.as_posix(), "-c", "copy", out.as_posix()
        )
        return out.read_bytes()


def build_srt(script: str, *, total_seconds: float) -> str:
    """Naive even-split captions — good enough for a spot check; replace with a
    forced-alignment pass later."""
    sentences = [s.strip() for s in script.replace("\n", " ").split(". ") if s.strip()]
    if not sentences:
        return ""
    per = total_seconds / len(sentences)
    lines = []
    for i, sentence in enumerate(sentences):
        start, end = i * per, (i + 1) * per
        lines.append(f"{i + 1}\n{_ts(start)} --> {_ts(end)}\n{sentence.rstrip('.')}.\n")
    return "\n".join(lines)


def _ts(seconds: float) -> str:
    ms = int((seconds - int(seconds)) * 1000)
    s = int(seconds)
    return f"{s // 3600:02d}:{s % 3600 // 60:02d}:{s % 60:02d},{ms:03d}"


async def package(*, video_url: str, srt_text: str, aspect: str) -> bytes:
    """Download the avatar video, burn captions + loudnorm, return MP4 bytes."""
    with tempfile.TemporaryDirectory() as tmp:
        d = Path(tmp)
        src, srt, out = d / "src.mp4", d / "subs.srt", d / f"out_{aspect}.mp4"
        await _download(video_url, src)
        srt.write_text(srt_text or "1\n00:00:00,000 --> 00:00:01,000\n \n")

        w, h = (1080, 1920) if aspect == "9x16" else (1920, 1080)
        vf = (
            f"scale={w}:{h}:force_original_aspect_ratio=increase,"
            f"crop={w}:{h},"
            f"subtitles={srt.as_posix()}:force_style='FontSize=22,Outline=2,Alignment=2'"
        )
        await _run(
            "-i",
            src.as_posix(),
            "-vf",
            vf,
            "-af",
            "loudnorm=I=-16:TP=-1.5:LRA=11",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "20",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
            out.as_posix(),
        )
        return out.read_bytes()
