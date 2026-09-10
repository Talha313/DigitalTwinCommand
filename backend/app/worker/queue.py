from __future__ import annotations

from typing import Any

from arq import create_pool
from arq.connections import ArqRedis, RedisSettings

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)

_pool: ArqRedis | None = None


def redis_settings() -> RedisSettings:
    return RedisSettings.from_dsn(settings.redis_url)


async def get_pool() -> ArqRedis:
    global _pool
    if _pool is None:
        _pool = await create_pool(redis_settings())
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None


async def enqueue(task: str, *args: Any, **kwargs: Any) -> str | None:
    """Best-effort enqueue. Returns the job id, or None if Redis is unreachable."""
    try:
        pool = await get_pool()
        job = await pool.enqueue_job(task, *args, **kwargs)
        return job.job_id if job else None
    except Exception:
        log.warning("could not enqueue %s — is Redis running?", task)
        return None
