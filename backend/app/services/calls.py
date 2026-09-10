from __future__ import annotations

from datetime import UTC, datetime

from fastapi import Depends
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models.call import Call, CallRole
from app.db.models.enums import CallDirection, CallStatus, WhisperStatus
from app.db.models.utterance import Utterance
from app.db.models.whisper import Whisper
from app.db.session import session_scope
from app.dependencies import db_session
from app.errors import ConflictError, NotConfiguredError, ValidationError
from app.models.calls import (
    CallOutcomeUpdate,
    CallRead,
    CallRolesUpdate,
    OutboundCallRequest,
    WhisperCreate,
    WhisperRead,
)
from app.models.utterances import UtteranceRead
from app.providers.twilio_client import twilio_client
from app.realtime.bridge import registry
from app.services.base import Service, as_uuid
from app.services.roles import load_roles_for_prompt

log = get_logger(__name__)


class CallService(Service):
    async def _role_ids(self, call_id) -> list[str]:
        rows = (
            await self.session.execute(
                select(CallRole.role_id).where(CallRole.call_id == as_uuid(call_id))
            )
        ).scalars()
        return [str(r) for r in rows]

    async def _read(self, call: Call) -> CallRead:
        data = CallRead.model_validate(call)
        data.role_ids = await self._role_ids(call.id)
        return data

    async def list_calls(self, *, limit: int = 100, offset: int = 0) -> list[CallRead]:
        rows = (
            (
                await self.session.execute(
                    select(Call)
                    .order_by(Call.created_at.desc())
                    .limit(min(limit, 500))
                    .offset(offset)
                )
            )
            .scalars()
            .all()
        )
        return [await self._read(c) for c in rows]

    async def get_call(self, call_id: str) -> CallRead:
        return await self._read(await self._get(Call, call_id, label="Call"))

    async def list_utterances(self, call_id: str) -> list[UtteranceRead]:
        await self._get(Call, call_id, label="Call")
        rows = (
            (
                await self.session.execute(
                    select(Utterance)
                    .where(Utterance.call_id == as_uuid(call_id))
                    .order_by(Utterance.timestamp, Utterance.created_at)
                )
            )
            .scalars()
            .all()
        )
        return [UtteranceRead.model_validate(r) for r in rows]

    async def start_outbound(
        self, data: OutboundCallRequest, *, user_id: str | None = None
    ) -> CallRead:
        if not twilio_client.configured:
            raise NotConfiguredError("Twilio is not configured — cannot place calls.")
        if data.role_ids:
            await load_roles_for_prompt(self.session, data.role_ids)

        call = Call(
            user_id=as_uuid(user_id) if user_id else None,
            direction=CallDirection.OUTGOING,
            status=CallStatus.QUEUED,
            from_e164=settings.twilio_phone_number,
            to_e164=data.to_e164,
            recording_consent=data.recording_consent,
        )
        self.session.add(call)
        await self.session.flush()
        for rid in dict.fromkeys(data.role_ids):
            self.session.add(CallRole(call_id=call.id, role_id=as_uuid(rid)))
        await self.session.flush()

        answer_url = f"{settings.public_host}/twilio/voice?call_id={call.id}"
        if data.first_message:
            answer_url += f"&first_message={data.first_message}"
        status_url = f"{settings.public_host}/twilio/status?call_id={call.id}"
        try:
            result = await twilio_client.create_call(
                to=data.to_e164, answer_url=answer_url, status_callback=status_url
            )
        except Exception:
            call.status = CallStatus.FAILED
            await self.session.flush()
            raise
        call.twilio_sid = result.get("sid")
        call.status = CallStatus.RINGING
        await self.session.flush()
        return await self._read(call)

    async def set_roles(self, call_id: str, data: CallRolesUpdate) -> CallRead:
        call = await self._get(Call, call_id, label="Call")
        if data.role_ids:
            await load_roles_for_prompt(self.session, data.role_ids)
        await self.session.execute(delete(CallRole).where(CallRole.call_id == call.id))
        for rid in dict.fromkeys(data.role_ids):
            self.session.add(CallRole(call_id=call.id, role_id=as_uuid(rid)))
        await self.session.flush()
        sess = registry.get(str(call.id))
        if sess is not None:
            sess.role_ids = data.role_ids
        return await self._read(call)

    async def set_outcome(self, call_id: str, data: CallOutcomeUpdate) -> CallRead:
        call = await self._get(Call, call_id, label="Call")
        call.outcome = data.outcome
        if data.summary is not None:
            call.summary = data.summary
        await self.session.flush()
        return await self._read(call)

    async def mute(self, call_id: str, *, muted: bool = True) -> CallRead:
        return await self._control(call_id, "mute", muted=muted)

    async def hold(self, call_id: str, *, held: bool = True) -> CallRead:
        call = await self._get(Call, call_id, label="Call")
        if call.twilio_sid and twilio_client.configured:
            if held:
                await twilio_client.redirect_to_hold(
                    call.twilio_sid, f"{settings.public_host}/twilio/hold"
                )
            else:
                await twilio_client.update_call(
                    call.twilio_sid,
                    Url=f"{settings.public_host}/twilio/voice?call_id={call.id}",
                    Method="POST",
                )
        return await self._read(call)

    async def hangup(self, call_id: str) -> CallRead:
        call = await self._get(Call, call_id, label="Call")
        sess = registry.get(str(call.id))
        if sess is not None:
            await sess.close(reason="operator_hangup")
        if call.twilio_sid and twilio_client.configured:
            try:
                await twilio_client.hangup(call.twilio_sid)
            except Exception:
                log.warning("twilio hangup failed for %s", call.twilio_sid)
        call.status = CallStatus.COMPLETED
        if call.ended_at is None:
            call.ended_at = datetime.now(UTC)
        await self.session.flush()
        return await self._read(call)

    async def _control(self, call_id: str, action: str, **kw) -> CallRead:
        call = await self._get(Call, call_id, label="Call")
        if not call.twilio_sid or not twilio_client.configured:
            raise ValidationError("Call is not connected to Twilio.")
        # Twilio has no direct mute; we stop relaying caller audio in the bridge.
        sess = registry.get(str(call.id))
        if sess is not None and action == "mute":
            sess.muted = bool(kw.get("muted"))
        return await self._read(call)

    # --- whisper (called by the whispers router) --------------------

    async def create_whisper(
        self, call_id: str, data: WhisperCreate, *, user_id: str | None = None
    ) -> WhisperRead:
        call = await self._get(Call, call_id, label="Call")
        sess = registry.get(str(call.id))
        if sess is None:
            raise ConflictError("This call is not live — a whisper cannot be sent.")

        whisper = Whisper(
            call_id=call.id,
            text=data.text,
            kind=data.kind,
            status=WhisperStatus.QUEUED,
            created_by=as_uuid(user_id) if user_id else None,
        )
        self.session.add(whisper)
        await self.session.flush()
        wid = str(whisper.id)
        # Commit so the bridge's own session can see the row it will update.
        await self.session.commit()
        try:
            await sess.inject_whisper(wid, data.text, data.kind)
        except Exception as exc:
            async with session_scope() as s2:
                w2 = await s2.get(Whisper, as_uuid(wid))
                if w2 is not None:
                    w2.status = WhisperStatus.FAILED
            raise ConflictError(f"Failed to inject whisper: {exc}") from exc
        await self.session.refresh(whisper)
        return WhisperRead.model_validate(whisper)


def get_calls_service(session: AsyncSession = Depends(db_session)) -> CallService:
    return CallService(session)
