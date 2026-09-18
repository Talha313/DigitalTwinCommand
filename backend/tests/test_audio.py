from __future__ import annotations

import base64

from app.realtime.audio import agent_to_twilio, parse_format, twilio_to_agent


def test_parse_format() -> None:
    assert parse_format("pcm_16000") == ("pcm", 16000)
    assert parse_format("ulaw_8000") == ("ulaw", 8000)
    assert parse_format("mulaw_8000") == ("ulaw", 8000)
    assert parse_format(None) == ("ulaw", 8000)


def test_ulaw_agent_is_passthrough() -> None:
    assert twilio_to_agent("ulaw_8000").passthrough is True
    assert agent_to_twilio("ulaw_8000").passthrough is True


def test_pcm_agent_transcodes_roundtrip() -> None:
    to_agent = twilio_to_agent("pcm_16000")
    to_twilio = agent_to_twilio("pcm_16000")
    assert to_agent.passthrough is False

    twilio_chunk = base64.b64encode(b"\xff" * 160).decode()
    pcm16k = to_agent.convert_b64(twilio_chunk)
    assert len(base64.b64decode(pcm16k)) > 400

    back = to_twilio.convert_b64(pcm16k)
    assert 120 <= len(base64.b64decode(back)) <= 200
