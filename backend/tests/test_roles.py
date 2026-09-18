from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_seeded_roles_present(auth_client: AsyncClient) -> None:
    r = await auth_client.get("/api/roles")
    assert r.status_code == 200
    names = {role["name"] for role in r.json()}
    assert {"Market Analyst", "Client Relations", "Executive Assistant"} <= names


async def test_create_and_update_role(auth_client: AsyncClient) -> None:
    perms = (await auth_client.get("/api/permissions")).json()
    tools = (await auth_client.get("/api/tools")).json()
    pid = perms[0]["id"]
    tid = tools[0]["id"]

    r = await auth_client.post(
        "/api/roles",
        json={
            "name": "Test Role",
            "description": "temp",
            "risk_level": "high",
            "permission_ids": [pid],
            "tool_ids": [tid],
        },
    )
    assert r.status_code == 201, r.text
    role = r.json()
    assert role["risk_level"] == "high"
    assert len(role["permissions"]) == 1
    assert len(role["tools"]) == 1

    r = await auth_client.patch(
        f"/api/roles/{role['id']}", json={"tone": "brisk", "permission_ids": []}
    )
    assert r.status_code == 200
    assert r.json()["tone"] == "brisk"
    assert r.json()["permissions"] == []


async def test_create_role_unknown_permission(auth_client: AsyncClient) -> None:
    r = await auth_client.post(
        "/api/roles",
        json={"name": "Bad", "permission_ids": ["00000000-0000-0000-0000-000000000000"]},
    )
    assert r.status_code == 422


async def test_operator_cannot_create_role(client: AsyncClient) -> None:
    await client.post(
        "/api/auth/signup", json={"email": "op@example.com", "password": "password123"}
    )
    r = await client.post(
        "/api/auth/signup", json={"email": "op2@example.com", "password": "password123"}
    )
    token = r.json()["access_token"]
    r = await client.post(
        "/api/roles",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Nope"},
    )
    assert r.status_code == 403
