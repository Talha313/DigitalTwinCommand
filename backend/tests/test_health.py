from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_health(client: AsyncClient) -> None:
    r = await client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "elevenlabs" in body["call_llm"]
    assert body["database"] is True


async def test_protected_endpoint_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/api/roles")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "unauthorized"
