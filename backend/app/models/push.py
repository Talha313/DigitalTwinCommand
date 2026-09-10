from __future__ import annotations

from pydantic import BaseModel


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: PushKeys
    user_agent: str | None = None


class VapidPublicKey(BaseModel):
    public_key: str
    configured: bool
