"""PWA live-call WebSocket. Auth via ?token=<access token> (query param, since
browsers cannot set headers on WebSocket connects)."""

from __future__ import annotations

import asyncio
import contextlib

import jwt
from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketDisconnect

from app.core.logging import get_logger
from app.core.security import decode_token
from app.db.models.call import Call
from app.db.session import session_scope
from app.realtime.hub import hub
from app.services.base import as_uuid

log = get_logger(__name__)

router = APIRouter(prefix="/ws", tags=["realtime"])


@router.websocket("/calls/{call_id}")
async def call_stream(ws: WebSocket, call_id: str, token: str = "", after: int = 0) -> None:
    try:
        decode_token(token, expected_type="access")
    except (jwt.InvalidTokenError, Exception):
        await ws.close(code=4401)
        return

    async with session_scope() as session:
        call = await session.get(Call, as_uuid(call_id))
        if call is None:
            await ws.close(code=4404)
            return

    await ws.accept()
    channel = hub.channel(call_id)

    for event in channel.replay(after):
        await ws.send_json(event)

    queue = channel.subscribe()
    pinger = asyncio.create_task(_ping(ws))
    try:
        while True:
            recv = asyncio.create_task(ws.receive_text())
            nxt = asyncio.create_task(queue.get())
            done, pending = await asyncio.wait({recv, nxt}, return_when=asyncio.FIRST_COMPLETED)
            for t in pending:
                t.cancel()
            if recv in done:
                with contextlib.suppress(Exception):
                    recv.result()
            if nxt in done:
                await ws.send_json(nxt.result())
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        pinger.cancel()
        channel.unsubscribe(queue)


async def _ping(ws: WebSocket) -> None:
    with contextlib.suppress(Exception):
        while True:
            await asyncio.sleep(25)
            await ws.send_json({"type": "ping"})
