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
    assert r.json()["ok"] is False


async def test_avatar_submit_requires_video(auth_client: AsyncClient) -> None:
    from datetime import date

    from app.db.models.enums import ReportStatus
    from app.db.models.report import Report
    from app.db.session import session_scope

    async with session_scope() as session:
        report = Report(date=date(2030, 1, 1), status=ReportStatus.AWAITING_AVATAR)
        session.add(report)
        await session.flush()
        rid = str(report.id)

    r = await auth_client.post(f"/api/reports/{rid}/avatar", data={})
    assert r.status_code == 422

    r = await auth_client.post(
        f"/api/reports/{rid}/avatar",
        data={"video_16x9_url": "https://example.com/report.mp4"},
    )
    assert r.status_code == 202
    assert r.json()["status"] == "generating"


async def test_health_reports_lipsync_provider(client: AsyncClient) -> None:
    body = (await client.get("/api/health")).json()
    assert "lipsync" in body
    assert body["lipsync"].startswith("elevenlabs")
