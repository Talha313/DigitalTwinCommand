"""In-process pub/sub for live call events, with a bounded replay buffer so a
reconnecting PWA can catch up on missed events (spec 6.3)."""

from __future__ import annotations

import asyncio
from collections import deque
from typing import Any

from app.core.logging import get_logger

log = get_logger(__name__)

_REPLAY = 200


class CallChannel:
    def __init__(self, call_id: str) -> None:
        self.call_id = call_id
        self._subscribers: set[asyncio.Queue[dict[str, Any]]] = set()
        self._buffer: deque[dict[str, Any]] = deque(maxlen=_REPLAY)
        self._seq = 0

    def publish(self, event: dict[str, Any]) -> None:
        self._seq += 1
        event = {"seq": self._seq, **event}
        self._buffer.append(event)
        for q in list(self._subscribers):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:  # pragma: no cover
                log.warning("dropping event for slow subscriber call=%s", self.call_id)

    def replay(self, after_seq: int) -> list[dict[str, Any]]:
        return [e for e in self._buffer if e["seq"] > after_seq]

    def subscribe(self) -> asyncio.Queue[dict[str, Any]]:
        q: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=1000)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue[dict[str, Any]]) -> None:
        self._subscribers.discard(q)

    @property
    def has_subscribers(self) -> bool:
        return bool(self._subscribers)


class Hub:
    def __init__(self) -> None:
        self._channels: dict[str, CallChannel] = {}
        self._lock = asyncio.Lock()

    def channel(self, call_id: str) -> CallChannel:
        ch = self._channels.get(call_id)
        if ch is None:
            ch = self._channels[call_id] = CallChannel(call_id)
        return ch

    def publish(self, call_id: str, event: dict[str, Any]) -> None:
        self.channel(call_id).publish(event)

    def drop(self, call_id: str) -> None:
        self._channels.pop(call_id, None)


hub = Hub()
