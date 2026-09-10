from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.echo_sql,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
)

async_session_factory = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession, autoflush=False
)


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI request-scoped session — commits on success, rolls back on error."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    """Standalone session for workers, scripts, and the telephony bridge."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
