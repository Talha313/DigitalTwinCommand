from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_conversation_crud(auth_client: AsyncClient) -> None:
    roles = (await auth_client.get("/api/roles")).json()
    rid = roles[0]["id"]

    r = await auth_client.post(
        "/api/conversations", json={"title": "Morning check-in", "role_ids": [rid]}
    )
    assert r.status_code == 201, r.text
    conv = r.json()
    assert conv["role_ids"] == [rid]

    r = await auth_client.post(
        f"/api/conversations/{conv['id']}/messages", json={"content": "hi twin"}
    )
    assert r.status_code == 201
    assert r.json()["role"] == "user"

    r = await auth_client.get(f"/api/conversations/{conv['id']}/messages")
    assert len(r.json()) == 1

    r = await auth_client.get("/api/conversations")
    row = next(c for c in r.json() if c["id"] == conv["id"])
    assert row["message_count"] == 1

    r = await auth_client.patch(
        f"/api/conversations/{conv['id']}", json={"title": "Renamed"}
    )
    assert r.json()["title"] == "Renamed"

    r = await auth_client.delete(f"/api/conversations/{conv['id']}")
    assert r.status_code == 204

    r = await auth_client.get(f"/api/conversations/{conv['id']}")
    assert r.status_code == 404


async def test_chat_stream_without_key_emits_error(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.core.config import settings

    monkeypatch.setattr(settings, "xai_api_key", "")
    async with auth_client.stream(
        "POST", "/api/chat/stream", json={"content": "hello"}
    ) as resp:
        assert resp.status_code == 200
        body = ""
        async for chunk in resp.aiter_text():
            body += chunk
    assert '"type": "start"' in body
    assert '"type": "error"' in body
