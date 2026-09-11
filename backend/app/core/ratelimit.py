from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# In-memory storage is fine for a single process. For a multi-instance deploy,
# set this to ``settings.redis_url`` and install ``limits[redis]``.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    enabled=not settings.debug,
    headers_enabled=True,
)
