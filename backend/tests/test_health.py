from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_unimplemented_returns_501(client: TestClient) -> None:
    r = client.get("/api/roles")
    assert r.status_code == 501
    assert r.json()["error"]["code"] == "not_implemented"
