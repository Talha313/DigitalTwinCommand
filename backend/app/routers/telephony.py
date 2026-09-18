"""Twilio webhooks + the Media Streams WebSocket. These endpoints are called by
Twilio, not the PWA, and are authenticated by Twilio request signatures."""

from __future__ import annotations

import json

from fastapi import APIRouter, Request, WebSocket
from fastapi.responses import Response
from starlette.websockets import WebSocketDisconnect

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models.call import Call, CallRole
from app.db.models.enums import CallDirection, CallStatus
from app.db.session import session_scope
from app.providers.twilio_client import twilio_client
from app.realtime.bridge import get_or_create_session, registry
from app.services.base import as_uuid

log = get_logger(__name__)

router = APIRouter(prefix="/twilio", tags=["telephony"])


def _twiml(body: str) -> Response:
    return Response(content=body, media_type="application/xml")


async def _validate(request: Request, params: dict[str, str]) -> bool:
    return twilio_client.validate_signature(
        str(request.url), params, request.headers.get("X-Twilio-Signature")
    )


@router.post("/voice")
async def voice(
    request: Request, call_id: str = "", first_message: str = "", resume: bool = False
) -> Response:
    """Answer webhook — returns the <Stream> TwiML that bridges media to us."""
    form = dict((await request.form()).items())
    if not await _validate(request, form):
        return _twiml("<Response><Reject/></Response>")

    from_e164 = form.get("From")
    to_e164 = form.get("To")
    twilio_sid = form.get("CallSid")

    async with session_scope() as session:
        if call_id:
            call = await session.get(Call, as_uuid(call_id))
        else:
            call = None
        if call is None:
            call = Call(
                direction=CallDirection.INCOMING,
                status=CallStatus.IN_PROGRESS,
                from_e164=from_e164,
                to_e164=to_e164,
                twilio_sid=twilio_sid,
            )
            session.add(call)
            await session.flush()
            call_id = str(call.id)
        else:
            call.twilio_sid = call.twilio_sid or twilio_sid
            call.status = CallStatus.IN_PROGRESS

    answered_by = (form.get("AnsweredBy") or "").lower()
    if answered_by.startswith("machine") or answered_by == "fax":
        log.info("call %s: AnsweredBy=%s — not a human pickup, hanging up", call_id, answered_by)
        async with session_scope() as session:
            call = await session.get(Call, as_uuid(call_id))
            if call is not None:
                call.status = CallStatus.NO_ANSWER
        return _twiml("<Response><Hangup/></Response>")

    if twilio_sid and twilio_client.configured and not resume:
        try:
            await twilio_client.start_recording(
                twilio_sid,
                RecordingChannels="dual",
                RecordingStatusCallback=f"{settings.public_base}/twilio/recording-status?call_id={call_id}",
                RecordingStatusCallbackEvent="completed",
            )
        except Exception:
            log.warning("failed to start recording for call sid=%s", twilio_sid)

    stream_url = f"{settings.ws_host}/twilio/media"
    return _twiml(twilio_client.stream_twiml(stream_url, call_id=call_id))


@router.post("/hold")
async def hold() -> Response:
    return _twiml(twilio_client.hold_twiml())


@router.post("/status")
async def status_callback(request: Request, call_id: str = "") -> Response:
    form = dict((await request.form()).items())
    if not await _validate(request, form):
        return Response(status_code=403)

    call_status = (form.get("CallStatus") or "").lower()
    mapping = {
        "queued": CallStatus.QUEUED,
        "initiated": CallStatus.QUEUED,
        "ringing": CallStatus.RINGING,
        "in-progress": CallStatus.IN_PROGRESS,
        "completed": CallStatus.COMPLETED,
        "busy": CallStatus.FAILED,
        "failed": CallStatus.FAILED,
        "no-answer": CallStatus.NO_ANSWER,
        "canceled": CallStatus.CANCELED,
    }
    if call_id and call_status in mapping:
        async with session_scope() as session:
            call = await session.get(Call, as_uuid(call_id))
            if call is not None:
                if not (call_status == "completed" and call.status == CallStatus.NO_ANSWER):
                    call.status = mapping[call_status]
                if form.get("CallDuration"):
                    call.duration_seconds = int(form["CallDuration"])
        if call_status in {"completed", "failed", "no-answer", "canceled", "busy"}:
            sess = registry.get(call_id)
            if sess is not None:
                await sess.close(reason=f"twilio_{call_status}")
    return Response(status_code=204)


@router.post("/recording-status")
async def recording_status_callback(request: Request, call_id: str = "") -> Response:
    """RecordingStatusCallback — the only place Twilio actually delivers
    RecordingUrl. Fired once the (dual-channel) recording has finished
    processing, which is typically a few seconds after the call's own
    "completed" /twilio/status callback."""
    form = dict((await request.form()).items())
    if not await _validate(request, form):
        return Response(status_code=403)

    if call_id and form.get("RecordingStatus") == "completed" and form.get("RecordingUrl"):
        async with session_scope() as session:
            call = await session.get(Call, as_uuid(call_id))
            if call is not None:
                call.recording_url = form["RecordingUrl"]
    return Response(status_code=204)


@router.websocket("/media")
async def media_stream(ws: WebSocket) -> None:
    """Twilio Media Streams. Frames: connected / start / media / stop."""
    await ws.accept()
    call_id: str | None = None
    session_obj = None
    try:
        while True:
            try:
                raw = await ws.receive_text()
            except RuntimeError:
                break
            frame = json.loads(raw)
            event = frame.get("event")

            if event == "start":
                start = frame["start"]
                stream_sid = start["streamSid"]
                params = start.get("customParameters", {})
                call_id = params.get("call_id")
                if not call_id:
                    await ws.close(code=1008)
                    return
                role_ids, first_message = await _call_context(call_id)
                session_obj = await get_or_create_session(
                    call_id,
                    ws=ws,
                    stream_sid=stream_sid,
                    role_ids=role_ids,
                    first_message=first_message,
                )
                log.info("media stream open call=%s sid=%s", call_id, stream_sid)

            elif event == "media" and session_obj is not None:
                await session_obj.on_twilio_media(frame["media"]["payload"])

            elif event == "stop":
                break
    except WebSocketDisconnect:
        pass
    except Exception:
        log.exception("media stream error call=%s", call_id)
    finally:
        if session_obj is not None:
            await session_obj.on_twilio_stop(ws)


async def _call_context(call_id: str) -> tuple[list[str], str | None]:
    async with session_scope() as session:
        rows = (
            await session.execute(
                CallRole.__table__.select().where(CallRole.call_id == as_uuid(call_id))
            )
        ).all()
        role_ids = [str(r.role_id) for r in rows]
    return role_ids, None
