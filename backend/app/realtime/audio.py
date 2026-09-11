"""μ-law/PCM transcoding between Twilio Media Streams (always μ-law 8 kHz) and
whatever audio format the ElevenLabs agent is configured for.

If the agent is set to ``ulaw_8000`` (recommended for Twilio) this is a no-op.
"""

from __future__ import annotations

import base64
import warnings

with warnings.catch_warnings():
    warnings.simplefilter("ignore", DeprecationWarning)
    try:  # stdlib on 3.12, `audioop-lts` shim on 3.13+
        import audioop
    except ModuleNotFoundError:  # pragma: no cover
        audioop = None  # type: ignore[assignment]

from app.core.logging import get_logger

log = get_logger(__name__)

_TWILIO_RATE = 8000


def parse_format(fmt: str | None) -> tuple[str, int]:
    """'pcm_16000' -> ('pcm', 16000); 'ulaw_8000' -> ('ulaw', 8000)."""
    if not fmt:
        return "ulaw", 8000
    fmt = fmt.lower()
    encoding = "ulaw" if "ulaw" in fmt or "mulaw" in fmt else "pcm"
    rate = 8000
    for part in fmt.replace("mulaw", "").replace("ulaw", "").replace("pcm", "").split("_"):
        if part.isdigit():
            rate = int(part)
    return encoding, rate


class Transcoder:
    """One direction of conversion, keeping resampler state across chunks."""

    def __init__(self, src: tuple[str, int], dst: tuple[str, int]) -> None:
        self.src_enc, self.src_rate = src
        self.dst_enc, self.dst_rate = dst
        self._state = None
        self.passthrough = src == dst
        if not self.passthrough and audioop is None:  # pragma: no cover
            log.error(
                "audio transcoding needed (%s->%s) but `audioop` is unavailable; "
                "set the ElevenLabs agent audio format to ulaw_8000",
                src,
                dst,
            )

    def convert_b64(self, payload_b64: str) -> str:
        if self.passthrough or audioop is None:
            return payload_b64
        return base64.b64encode(self.convert(base64.b64decode(payload_b64))).decode()

    def convert(self, data: bytes) -> bytes:
        if self.passthrough or audioop is None:
            return data
        # -> 16-bit linear PCM at source rate
        pcm = audioop.ulaw2lin(data, 2) if self.src_enc == "ulaw" else data
        # resample
        if self.src_rate != self.dst_rate:
            pcm, self._state = audioop.ratecv(pcm, 2, 1, self.src_rate, self.dst_rate, self._state)
        # -> target encoding
        return audioop.lin2ulaw(pcm, 2) if self.dst_enc == "ulaw" else pcm


def twilio_to_agent(agent_input_format: str | None) -> Transcoder:
    return Transcoder(("ulaw", _TWILIO_RATE), parse_format(agent_input_format))


def agent_to_twilio(agent_output_format: str | None) -> Transcoder:
    return Transcoder(parse_format(agent_output_format), ("ulaw", _TWILIO_RATE))
