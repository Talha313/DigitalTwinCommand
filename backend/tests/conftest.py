from __future__ import annotations

import os
from collections.abc import AsyncIterator

os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql+asyncpg://shahzaib:12345@localhost:5432/dtcc_test",
    ),
)
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("BOOTSTRAP_ADMIN_PASSWORD", "")
os.environ.setdefault("SESSION_SECRET", "test-secret-0123456789abcdef0123456789")

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import create_app  # noqa: E402


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _schema() -> AsyncIterator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def app():
    application = create_app()
    async with application.router.lifespan_context(application):
        yield application


@pytest_asyncio.fixture
async def client(app) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient) -> AsyncClient:
    """A client signed in as an admin."""
    from sqlalchemy import select

    from app.db.models.enums import UserRole
    from app.db.models.user import User
    from app.db.session import session_scope

    email = f"admin+{os.urandom(4).hex()}@example.com"
    resp = await client.post(
        "/api/auth/signup",
        json={"email": email, "password": "supersecret123"},
    )
    assert resp.status_code == 201, resp.text
    async with session_scope() as session:
        user = (
            await session.execute(select(User).where(User.email == email))
        ).scalar_one()
        user.role = UserRole.ADMIN
    # re-login so the access token carries the admin claim
    resp = await client.post(
        "/api/auth/login", json={"email": email, "password": "supersecret123"}
    )
    client.headers["Authorization"] = f"Bearer {resp.json()['access_token']}"
    return client
