"""xAI Grok — used only by the daily-report worker to pull X/Twitter
headlines that Claude's web_search can't reach. Not used by the live phone
agent; that search tool is configured directly in ElevenLabs (see
docs/elevenlabs-tools.md)."""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import NotConfiguredError, UpstreamError
from app.providers.http import shared_client

log = get_logger(__name__)

_BASE = "https://api.x.ai/v1"
# x_search regularly takes 30-45s (multiple search + page-read round trips) —
# well past the shared client's default 30s timeout.
_TIMEOUT = httpx.Timeout(90.0, connect=10.0)


class XAIClient:
    @property
    def configured(self) -> bool:
        return bool(settings.xai_api_key)

    def _headers(self) -> dict[str, str]:
        if not self.configured:
            raise NotConfiguredError("XAI_API_KEY is not set.")
        return {
            "Authorization": f"Bearer {settings.xai_api_key}",
            "Content-Type": "application/json",
        }

    async def x_search(self, query: str) -> dict[str, Any]:
        """Ask Grok to search X/Twitter for `query`. Returns
        {text, citations, model, usage}. Raises UpstreamError on failure —
        callers should treat this as optional enrichment and not let it fail
        the whole report."""
        try:
            resp = await shared_client().post(
                f"{_BASE}/responses",
                headers=self._headers(),
                json={
                    "model": settings.xai_model,
                    "input": [{"role": "user", "content": query}],
                    "tools": [{"type": "x_search"}],
                },
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"xAI x_search failed: {exc}") from exc

        data = resp.json()
        message = next(
            (item for item in reversed(data.get("output", [])) if item.get("type") == "message"),
            None,
        )
        if message is None:
            return {"text": "", "citations": [], "model": data.get("model"), "usage": data.get("usage", {})}

        content = (message.get("content") or [{}])[0]
        citations = [
            {"url": a.get("url"), "title": a.get("title")}
            for a in content.get("annotations", [])
            if a.get("type") == "url_citation"
        ]
        return {
            "text": content.get("text", ""),
            "citations": citations,
            "model": data.get("model"),
            "usage": data.get("usage", {}),
        }


xai_client = XAIClient()
