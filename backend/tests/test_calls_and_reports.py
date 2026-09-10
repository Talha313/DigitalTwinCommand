from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_outbound_call_requires_twilio(auth_client: AsyncClient) -> None:
    r = await auth_client.post(
        "/api/calls/outbound", json={"to_e164": "+14155550123"}
    )
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "not_configured"


async def test_outbound_call_validates_number(auth_client: AsyncClient) -> None:
    r = await auth_client.post("/api/calls/outbound", json={"to_e164": "not-a-number"})
    assert r.status_code == 422


async def test_calls_list_empty(auth_client: AsyncClient) -> None:
    r = await auth_client.get("/api/calls")
    assert r.status_code == 200
    assert r.json() == []


async def test_whisper_on_missing_call_404(auth_client: AsyncClient) -> None:
    r = await auth_client.post(
        "/api/calls/00000000-0000-0000-0000-000000000000/whispers",
        json={"text": "hello"},
    )
    assert r.status_code == 404


async def test_report_generate_requires_redis_or_enqueues(auth_client: AsyncClient) -> None:
    # enqueue is best-effort; the report row is still created.
    r = await auth_client.post("/api/reports/generate")
    assert r.status_code in (202, 409)
    if r.status_code == 202:
        body = r.json()
        assert body["status"] in ("queued", "researching")
        r2 = await auth_client.get("/api/reports")
        assert any(rep["id"] == body["id"] for rep in r2.json())


async def test_integration_connection_test(auth_client: AsyncClient) -> None:
    integrations = (await auth_client.get("/api/integrations")).json()
    twilio = next(i for i in integrations if i["provider"] == "twilio")
    r = await auth_client.post(f"/api/integrations/{twilio['id']}/test")
    assert r.status_code == 200
    assert r.json()["ok"] is False  # nothing configured in tests
