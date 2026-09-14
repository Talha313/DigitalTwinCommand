"""ElevenLabs webhooks.

The media bridge already logs calls in real time; these webhooks add the
authoritative summary / cost / duration and a backstop if the bridge died.

Configure in ElevenLabs → Agents → your agent → Settings → Post-call webhook:
  URL     {PUBLIC_HOST}/webhooks/elevenlabs
  events  transcript  ✅   (post_call_transcription)
          call initiation failure  ✅
          audio  ❌   (not needed — the bridge streams audio)
Copy the signing secret into ELEVENLABS_WEBHOOK_SECRET.
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Request
from fastapi.responses import Response
from sqlalchemy import select

from app.core.logging import get_logger
from app.db.models.call import Call
from app.db.models.enums import CallStatus
from app.db.session import session_scope
from app.providers.elevenlabs import elevenlabs_client
from app.realtime.bridge import registry
from app.worker.queue import enqueue

log = get_logger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/elevenlabs")
async def elevenlabs_webhook(request: Request) -> Response:
    body = await request.body()
    if not elevenlabs_client.verify_webhook(body, request.headers.get("elevenlabs-signature")):
        return Response(status_code=403)

    payload = await request.json()
    event_type = payload.get("type", "")
    data = payload.get("data", payload) or {}

    if event_type == "call_initiation_failure":
        await _handle_failure(data)
        return Response(status_code=204)

    # post_call_transcription (default)
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return Response(status_code=204)

    analysis = data.get("analysis") or {}
    meta = data.get("metadata") or {}
    call_db_id: str | None = None
    async with session_scope() as session:
        call = (
            await session.execute(
                select(Call).where(Call.eleven_conversation_id == conversation_id)
            )
        ).scalar_one_or_none()
        if call is None:
            log.info("post-call webhook for unknown conversation %s", conversation_id)
            return Response(status_code=204)
        live = registry.get(str(call.id))
        if live is not None and not live._closing:
            # An agent conversation can expire while the telephone call is held.
            return Response(status_code=204)
        if summary := analysis.get("transcript_summary"):
            call.summary = summary
        if (secs := meta.get("call_duration_secs")) is not None:
            call.duration_seconds = int(secs)
        if (cost := meta.get("cost")) is not None:
            try:
                call.cost_cents = round(float(cost))
            except (TypeError, ValueError):
                pass
        if call.ended_at is None:
            call.ended_at = datetime.now(UTC)
        if call.status not in {CallStatus.FAILED, CallStatus.NO_ANSWER}:
            call.status = CallStatus.COMPLETED
        call_db_id = str(call.id)

    await enqueue("summarize_call", call_db_id)
    return Response(status_code=204)


async def _handle_failure(data: dict) -> None:
    conversation_id = data.get("conversation_id")
    twilio_sid = data.get("twilio_call_sid") or data.get("call_sid")
    reason = data.get("reason") or data.get("error") or "call_initiation_failure"
    async with session_scope() as session:
        call = None
        if conversation_id:
            call = (
                await session.execute(
                    select(Call).where(Call.eleven_conversation_id == conversation_id)
                )
            ).scalar_one_or_none()
        if call is None and twilio_sid:
            call = (
                await session.execute(select(Call).where(Call.twilio_sid == twilio_sid))
            ).scalar_one_or_none()
        if call is not None:
            call.status = CallStatus.FAILED
            call.ended_at = call.ended_at or datetime.now(UTC)
            call.summary = call.summary or f"Call failed: {reason}"
    log.warning("ElevenLabs call initiation failure: %s", reason)
