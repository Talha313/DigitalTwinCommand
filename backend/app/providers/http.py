from __future__ import annotations

import httpx

_client: httpx.AsyncClient | None = None


def shared_client() -> httpx.AsyncClient:
    """Process-wide async HTTP client with sane timeouts and keep-alive."""
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0),
            limits=httpx.Limits(max_connections=50, max_keepalive_connections=10),
            follow_redirects=True,
        )
    return _client


async def close_shared_client() -> None:
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
    _client = None
