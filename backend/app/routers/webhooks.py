"""ElevenLabs post-call webhook — final transcript, audio and analysis."""

from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import Response

from app.core.logging import get_logger
from app.db.models.call import Call
from app.db.session import session_scope
from app.providers.elevenlabs import elevenlabs_client
from app.worker.queue import enqueue

log = get_logger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/elevenlabs")
async def elevenlabs_post_call(request: Request) -> Response:
    body = await request.body()
    if not elevenlabs_client.verify_webhook(body, request.headers.get("ElevenLabs-Signature")):
        return Response(status_code=403)

    payload = await request.json()
    data = payload.get("data", payload)
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return Response(status_code=204)

    analysis = data.get("analysis", {}) or {}
    meta = data.get("metadata", {}) or {}
    async with session_scope() as session:
        call = (
            await session.execute(
                Call.__table__.select().where(Call.eleven_conversation_id == conversation_id)
            )
        ).first()
        if call is None:
            log.info("post-call webhook for unknown conversation %s", conversation_id)
            return Response(status_code=204)
        row = await session.get(Call, call.id)
        if summary := analysis.get("transcript_summary"):
            row.summary = summary
        if (secs := meta.get("call_duration_secs")) is not None:
            row.duration_seconds = int(secs)
        if (cost := meta.get("cost")) is not None:
            row.cost_cents = round(float(cost))
        call_db_id = str(row.id)

    await enqueue("summarize_call", call_db_id)
    return Response(status_code=204)
