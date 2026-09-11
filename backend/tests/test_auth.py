from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_signup_login_refresh_logout(client: AsyncClient) -> None:
    email = "user1@example.com"
    r = await client.post(
        "/api/auth/signup", json={"email": email, "password": "hunter2hunter2"}
    )
    assert r.status_code == 201, r.text
    tokens = r.json()
    assert tokens["user"]["email"] == email
    assert tokens["access_token"]

    r = await client.post(
        "/api/auth/login", json={"email": email, "password": "hunter2hunter2"}
    )
    assert r.status_code == 200

    r = await client.post("/api/auth/refresh")
    assert r.status_code == 200
    assert r.json()["access_token"] != tokens["access_token"]

    r = await client.post("/api/auth/logout")
    assert r.status_code == 204


async def test_login_wrong_password(client: AsyncClient) -> None:
    await client.post(
        "/api/auth/signup", json={"email": "u2@example.com", "password": "rightpass12"}
    )
    r = await client.post(
        "/api/auth/login", json={"email": "u2@example.com", "password": "wrongpass12"}
    )
    assert r.status_code == 401


async def test_duplicate_signup(client: AsyncClient) -> None:
    await client.post(
        "/api/auth/signup", json={"email": "dup@example.com", "password": "password123"}
    )
    r = await client.post(
        "/api/auth/signup", json={"email": "dup@example.com", "password": "password123"}
    )
    assert r.status_code == 409


async def test_password_reset_flow(client: AsyncClient) -> None:
    email = "reset@example.com"
    await client.post(
        "/api/auth/signup", json={"email": email, "password": "oldpassword1"}
    )
    r = await client.post("/api/auth/forgot-password", json={"email": email})
    assert r.status_code == 200
    token = r.json()["reset_token"]
    assert token

    r = await client.post(
        "/api/auth/reset-password", json={"token": token, "password": "brandnewpass1"}
    )
    assert r.status_code == 204

    r = await client.post(
        "/api/auth/login", json={"email": email, "password": "brandnewpass1"}
    )
    assert r.status_code == 200
