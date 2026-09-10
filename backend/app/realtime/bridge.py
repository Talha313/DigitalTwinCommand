"""The media bridge.

    Twilio Media Streams  ⇄  CallSession  ⇄  ElevenLabs Agent (LLM = Claude, native)

The session owns the ElevenLabs conversation socket, so the operator can inject
whispers (`contextual_update` / `user_message`), we get the live transcript, and
we log every turn. The ElevenLabs agent MUST be configured with input/output
audio format ``ulaw_8000`` so audio passes through without transcoding.
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

        signed_url = await elevenlabs_client.get_signed_url()
        self.eleven_ws = await websockets.connect(signed_url, max_size=None)
        init: dict[str, Any] = {
            "type": "conversation_initiation_client_data",
            "conversation_config_override": {
                "agent": {"prompt": {"prompt": system}, "language": "en"},
            },
        }
        if self.first_message:
            init["conversation_config_override"]["agent"]["first_message"] = self.first_message
        await self.eleven_ws.send(json.dumps(init))
        self._pump_task = asyncio.create_task(self._pump_eleven())
        self._publish("status", status="connected")
        await self._set_call_status(CallStatus.IN_PROGRESS, started=True)

    def attach_twilio(self, ws: Any, stream_sid: str) -> None:
        self.twilio_ws = ws
        self.stream_sid = stream_sid

    async def close(self, *, reason: str = "hangup") -> None:
        if self._closing:
            return
        self._closing = True
        self._publish("status", status="ended", reason=reason)
        if self._pump_task:
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
        if self.eleven_ws is None or self._closing or self.muted:
            return
        with contextlib.suppress(ConnectionClosed):
            await self.eleven_ws.send(json.dumps({"user_audio_chunk": payload_b64}))

    async def on_twilio_stop(self) -> None:
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
                await self.close(reason="agent_disconnect")

    async def _handle_eleven(self, msg: dict[str, Any]) -> None:
        mtype = msg.get("type")

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
            if audio and self.twilio_ws is not None and self.stream_sid:
                with contextlib.suppress(Exception):
                    await self.twilio_ws.send_text(
                        json.dumps(
                            {
                                "event": "media",
                                "streamSid": self.stream_sid,
                                "media": {"payload": audio},
                            }
                        )
                    )

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

    # --- whisper injection ------------------------------------------

    async def inject_whisper(self, whisper_id: str, text: str, kind: WhisperKind) -> None:
        if self.eleven_ws is None or self._closing:
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
    call_id: str, *, role_ids: list[str], first_message: str | None = None
) -> CallSession:
    sess = registry.get(call_id)
    if sess is None:
        sess = CallSession(call_id, role_ids=role_ids, first_message=first_message)
        registry[call_id] = sess
        await sess.start()
    return sess
