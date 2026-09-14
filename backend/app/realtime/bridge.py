"""The media bridge.

    Twilio Media Streams  ⇄  CallSession  ⇄  ElevenLabs Agent (LLM = Claude, native)

The session owns the ElevenLabs conversation socket, so the operator can inject
whispers (`contextual_update` / `user_message`), we get the live transcript, and
we log every turn. Audio is transcoded to/from Twilio's μ-law 8 kHz based on the
agent's configured format (set the agent to ``ulaw_8000`` to skip transcoding).
"""

from __future__ import annotations

import asyncio
import contextlib
import json
from datetime import UTC, datetime
from typing import Any

import websockets
from websockets.exceptions import ConnectionClosed

from app.core.logging import get_logger
from app.db.models.call import Call
from app.db.models.enums import (
    CallStatus,
    UtteranceSource,
    UtteranceSpeaker,
    WhisperKind,
    WhisperStatus,
)
from app.db.models.utterance import Utterance
from app.db.models.whisper import Whisper
from app.db.session import session_scope
from app.providers.elevenlabs import elevenlabs_client
from app.realtime.audio import agent_to_twilio, twilio_to_agent
from app.realtime.hub import hub
from app.services.base import as_uuid
from app.services.prompting import build_system_prompt
from app.services.roles import load_roles_for_prompt

log = get_logger(__name__)


class CallSession:
    def __init__(self, call_id: str, *, role_ids: list[str], first_message: str | None = None):
        self.call_id = call_id
        self.role_ids = role_ids
        self.first_message = first_message
        self.eleven_ws: websockets.WebSocketClientProtocol | None = None
        self.twilio_ws: Any | None = None
        self.stream_sid: str | None = None
        self.eleven_conversation_id: str | None = None
        self._started = datetime.now(UTC)
        self._pump_task: asyncio.Task | None = None
        self._closing = False
        self.muted = False
        self.held = False
        self.control_lock = asyncio.Lock()
        self._to_agent = twilio_to_agent("ulaw_8000")
        self._to_twilio = agent_to_twilio("ulaw_8000")

    # --- lifecycle -------------------------------------------------------

    async def start(self) -> None:
        system = ""
        try:
            async with session_scope() as session:
                roles = await load_roles_for_prompt(session, self.role_ids) if self.role_ids else []
                system = build_system_prompt(roles, channel="call")
        except Exception:
            log.exception("prompt build failed; using default")
            system = build_system_prompt([], channel="call")

        # Learn the agent's audio format so we can transcode to/from Twilio's
        # μ-law 8 kHz, and warn if prompt overrides are disabled (then the
        # role-based system prompt below is ignored by ElevenLabs).
        prompt_override_ok = True
        language_override_ok = True
        first_message_override_ok = True
        try:
            agent_cfg = await elevenlabs_client.agent()
            cfg = agent_cfg.get("conversation_config", {})
            in_fmt = cfg.get("asr", {}).get("user_input_audio_format")
            out_fmt = cfg.get("tts", {}).get("agent_output_audio_format")
            self._to_agent = twilio_to_agent(in_fmt)
            self._to_twilio = agent_to_twilio(out_fmt)
            if not (self._to_agent.passthrough and self._to_twilio.passthrough):
                log.info("call %s transcoding audio: in=%s out=%s", self.call_id, in_fmt, out_fmt)
            agent_ov = (
                agent_cfg.get("platform_settings", {})
                .get("overrides", {})
                .get("conversation_config_override", {})
                .get("agent", {})
            )
            prompt_override_ok = bool((agent_ov.get("prompt") or {}).get("prompt"))
            language_override_ok = bool(agent_ov.get("language"))
            first_message_override_ok = bool(agent_ov.get("first_message"))
            if not prompt_override_ok:
                log.warning(
                    "call %s: ElevenLabs agent has prompt overrides disabled — the "
                    "role-based system prompt will be ignored (enable in the agent's "
                    "Security → Overrides settings). Whispers still work.",
                    self.call_id,
                )
        except Exception:
            log.warning("could not read agent config; assuming ulaw_8000 + overrides on")

        self.eleven_ws = await self._connect_eleven()
        # Only send overrides the agent's Security -> Overrides settings actually
        # permit. ElevenLabs doesn't ignore a disallowed override field — it stalls
        # the whole conversation after the initial handshake instead of ever
        # starting a turn, which looks exactly like total silence on the call.
        agent_override: dict[str, Any] = {}
        if prompt_override_ok:
            agent_override["prompt"] = {"prompt": system}
        if language_override_ok:
            agent_override["language"] = "en"
        if self.first_message:
            if first_message_override_ok:
                agent_override["first_message"] = self.first_message
            else:
                log.warning(
                    "call %s: first_message override not permitted by agent; ignoring",
                    self.call_id,
                )
        init: dict[str, Any] = {"type": "conversation_initiation_client_data"}
        if agent_override:
            init["conversation_config_override"] = {"agent": agent_override}
        await self.eleven_ws.send(json.dumps(init))
        self._pump_task = asyncio.create_task(self._pump_eleven())
        self._publish("status", status="connected")
        await self._set_call_status(CallStatus.IN_PROGRESS, started=True)

    async def _connect_eleven(self, attempts: int = 2) -> Any:
        """A cold/slow handshake on ElevenLabs' side previously killed the
        whole call outright on the default 10s timeout with zero retry, even
        though Twilio and our own server were fine. Re-fetch a fresh signed
        URL per attempt — it's a short-lived token, not safe to reuse."""
        last_exc: Exception | None = None
        for attempt in range(1, attempts + 1):
            try:
                signed_url = await elevenlabs_client.get_signed_url()
                return await websockets.connect(signed_url, max_size=None, open_timeout=15)
            except TimeoutError as exc:
                last_exc = exc
                log.warning(
                    "call %s: ElevenLabs WS handshake timed out (attempt %d/%d)",
                    self.call_id,
                    attempt,
                    attempts,
                )
                if attempt < attempts:
                    await asyncio.sleep(1)
        raise last_exc  # type: ignore[misc]

    def attach_twilio(self, ws: Any, stream_sid: str) -> None:
        self.twilio_ws = ws
        self.stream_sid = stream_sid

    async def close(self, *, reason: str = "hangup") -> None:
        if self._closing:
            return
        self._closing = True
        self._publish("status", status="ended", reason=reason)
        if self._pump_task and self._pump_task is not asyncio.current_task():
            self._pump_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._pump_task
        for ws in (self.eleven_ws, self.twilio_ws):
            if ws is not None:
                with contextlib.suppress(Exception):
                    await ws.close()
        await self._finalize_call()
        registry.pop(self.call_id, None)
        hub.drop(self.call_id)

    # --- Twilio -> ElevenLabs -----------------------------------------

    async def on_twilio_media(self, payload_b64: str) -> None:
        if self.eleven_ws is None or self._closing or self.muted or self.held:
            return
        chunk = self._to_agent.convert_b64(payload_b64)
        with contextlib.suppress(ConnectionClosed):
            await self.eleven_ws.send(json.dumps({"user_audio_chunk": chunk}))

    async def on_twilio_stop(self, ws: Any = None) -> None:
        # A previous stream may finish after the resumed stream attaches.
        if ws is not None and ws is not self.twilio_ws:
            return
        self.twilio_ws = None
        self.stream_sid = None
        if not self.held:
            await self.close(reason="caller_hangup")

    # --- ElevenLabs -> Twilio + transcript ---------------------------

    async def _pump_eleven(self) -> None:
        assert self.eleven_ws is not None
        try:
            async for raw in self.eleven_ws:
                msg = json.loads(raw)
                await self._handle_eleven(msg)
        except (ConnectionClosed, asyncio.CancelledError):
            pass
        except Exception:
            log.exception("eleven pump crashed call=%s", self.call_id)
        finally:
            if not self._closing:
                self.eleven_ws = None
                if not self.held:
                    await self.close(reason="agent_disconnect")

    async def _handle_eleven(self, msg: dict[str, Any]) -> None:
        mtype = msg.get("type")
        log.info("call %s <- eleven type=%s", self.call_id, mtype)

        if mtype == "conversation_initiation_metadata":
            meta = msg.get("conversation_initiation_metadata_event", {})
            self.eleven_conversation_id = meta.get("conversation_id")
            if self.eleven_conversation_id:
                await self._save_conversation_id(self.eleven_conversation_id)

        elif mtype == "ping":
            event_id = msg.get("ping_event", {}).get("event_id")
            with contextlib.suppress(ConnectionClosed):
                await self.eleven_ws.send(  # type: ignore[union-attr]
                    json.dumps({"type": "pong", "event_id": event_id})
                )

        elif mtype == "audio":
            audio = msg.get("audio_event", {}).get("audio_base_64")
            log.info(
                "call %s audio chunk bytes=%s twilio_ws=%s stream_sid=%s",
                self.call_id,
                len(audio) if audio else 0,
                self.twilio_ws is not None,
                self.stream_sid,
            )
            if audio and not self.held and self.twilio_ws is not None and self.stream_sid:
                payload = self._to_twilio.convert_b64(audio)
                try:
                    await self.twilio_ws.send_text(
                        json.dumps(
                            {
                                "event": "media",
                                "streamSid": self.stream_sid,
                                "media": {"payload": payload},
                            }
                        )
                    )
                except Exception:
                    log.exception("call %s failed to relay audio to twilio", self.call_id)

        elif mtype == "interruption":
            # Barge-in: flush whatever Twilio has buffered.
            if self.twilio_ws is not None and self.stream_sid:
                with contextlib.suppress(Exception):
                    await self.twilio_ws.send_text(
                        json.dumps({"event": "clear", "streamSid": self.stream_sid})
                    )
            self._publish("status", status="listening")

        elif mtype == "user_transcript":
            text = msg.get("user_transcription_event", {}).get("user_transcript", "")
            if text.strip():
                await self._record_utterance(
                    UtteranceSpeaker.CALLER, text, UtteranceSource.ELEVENLABS
                )

        elif mtype == "agent_response":
            text = msg.get("agent_response_event", {}).get("agent_response", "")
            if text.strip():
                await self._record_utterance(UtteranceSpeaker.TWIN, text, UtteranceSource.LLM)
                self._publish("status", status="speaking")

        elif mtype == "agent_response_correction":
            corrected = msg.get("agent_response_correction_event", {}).get(
                "corrected_agent_response", ""
            )
            if corrected.strip():
                self._publish("transcript_correction", speaker="twin", text=corrected)

        elif mtype == "client_tool_call":
            self._publish(
                "tool_call",
                tool=msg.get("client_tool_call", {}).get("tool_name"),
            )

        elif mtype == "agent_tool_response":
            # Webhook/server tools (e.g. web_search) report here, not via
            # client_tool_call. Log the full payload while we confirm the
            # exact field names ElevenLabs sends for this event.
            event = msg.get("agent_tool_response_event", msg.get("agent_tool_response", {}))
            log.info("call %s tool response payload: %s", self.call_id, json.dumps(event))
            self._publish(
                "tool_call",
                tool=event.get("tool_name") or event.get("name"),
                status=event.get("status") or event.get("is_error"),
            )

    # --- whisper injection ------------------------------------------

    async def inject_whisper(self, whisper_id: str, text: str, kind: WhisperKind) -> None:
        if self.eleven_ws is None or self._closing or self.held:
            raise RuntimeError("Call is not connected.")
        if kind == WhisperKind.USER_MESSAGE:
            frame = {"type": "user_message", "text": text}
        else:
            frame = {
                "type": "contextual_update",
                "text": (
                    "Operator instruction — weave this in naturally on your next "
                    f"turn, do not announce it: {text}"
                ),
            }
        await self.eleven_ws.send(json.dumps(frame))
        now = datetime.now(UTC)
        async with session_scope() as session:
            w = await session.get(Whisper, as_uuid(whisper_id))
            if w is not None:
                w.status = WhisperStatus.INJECTED
                w.injected_at = now
            session.add(
                Utterance(
                    call_id=as_uuid(self.call_id),
                    speaker=UtteranceSpeaker.WHISPER,
                    text=text,
                    source=UtteranceSource.OPERATOR,
                    timestamp=now,
                )
            )
        self._publish(
            "whisper",
            whisper_id=whisper_id,
            text=text,
            status=WhisperStatus.INJECTED.value,
            gold=True,
        )

    # --- persistence helpers --------------------------------------

    async def _record_utterance(
        self, speaker: UtteranceSpeaker, text: str, source: UtteranceSource
    ) -> None:
        ts = datetime.now(UTC)
        async with session_scope() as session:
            session.add(
                Utterance(
                    call_id=as_uuid(self.call_id),
                    speaker=speaker,
                    text=text,
                    source=source,
                    timestamp=ts,
                )
            )
        self._publish(
            "transcript",
            speaker=speaker.value,
            text=text,
            timestamp=ts.isoformat(),
        )

    async def _save_conversation_id(self, conv_id: str) -> None:
        async with session_scope() as session:
            call = await session.get(Call, as_uuid(self.call_id))
            if call is not None:
                call.eleven_conversation_id = conv_id

    async def _set_call_status(self, status: CallStatus, *, started: bool = False) -> None:
        async with session_scope() as session:
            call = await session.get(Call, as_uuid(self.call_id))
            if call is None:
                return
            call.status = status
            if started and call.started_at is None:
                call.started_at = self._started

    async def _finalize_call(self) -> None:
        ended = datetime.now(UTC)
        async with session_scope() as session:
            call = await session.get(Call, as_uuid(self.call_id))
            if call is None:
                return
            call.ended_at = ended
            if call.started_at is not None:
                call.duration_seconds = int((ended - call.started_at).total_seconds())
            if call.status not in {CallStatus.FAILED, CallStatus.NO_ANSWER}:
                call.status = CallStatus.COMPLETED
        # Kick off post-call enrichment (summary + memory extraction).
        with contextlib.suppress(Exception):
            from app.worker.queue import enqueue

            await enqueue("summarize_call", self.call_id)

    def _publish(self, kind: str, **data: Any) -> None:
        hub.publish(self.call_id, {"type": kind, **data})


registry: dict[str, CallSession] = {}


async def get_or_create_session(
    call_id: str,
    *,
    ws: Any,
    stream_sid: str,
    role_ids: list[str],
    first_message: str | None = None,
) -> CallSession:
    sess = registry.get(call_id)
    if sess is None:
        sess = CallSession(call_id, role_ids=role_ids, first_message=first_message)
        registry[call_id] = sess
        # Attach before start(): start() connects to ElevenLabs and spawns the
        # audio pump task, which can receive the agent's first (greeting)
        # audio chunk almost immediately. If twilio_ws isn't set yet, that
        # audio is silently dropped instead of relayed — attaching first
        # closes that window.
        sess.attach_twilio(ws, stream_sid)
        await sess.start()
    else:
        sess.attach_twilio(ws, stream_sid)
        if sess.eleven_ws is None:
            await sess.start()
        sess.held = False
        sess._publish("status", status="muted" if sess.muted else "connected")
    return sess
