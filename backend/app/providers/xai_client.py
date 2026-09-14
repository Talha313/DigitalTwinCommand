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
# Grok's default reasoning effort makes even non-search calls slow — a plain
# script-writing call (no search, ~6000 output tokens) has been observed
# taking 300s+ and still timing out at 180s. This client is only used by the
# async daily-report worker (never the live call), where a few extra minutes
# costs nothing, so the timeout is generous on purpose.
_TIMEOUT = httpx.Timeout(600.0, connect=10.0)


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

    async def complete(
        self,
        *,
        system: str,
        messages: list[dict[str, Any]],
        model: str | None = None,
        max_tokens: int | None = None,
        web_search: bool = False,
    ) -> dict[str, Any]:
        """Non-streaming call, same shape as AnthropicClient.complete() so the
        two providers are interchangeable for the report pipeline. Returns
        {text, usage, tool_traces, model}."""
        body: dict[str, Any] = {
            "model": model or settings.xai_model,
            "instructions": system,
            "input": messages,
        }
        if max_tokens:
            body["max_output_tokens"] = max_tokens
        if web_search:
            body["tools"] = [{"type": "web_search"}]
        try:
            resp = await shared_client().post(
                f"{_BASE}/responses",
                headers=self._headers(),
                json=body,
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise UpstreamError(f"xAI complete failed: {exc}") from exc

        data = resp.json()
        message = next(
            (item for item in reversed(data.get("output", [])) if item.get("type") == "message"),
            None,
        )
        text = ""
        if message is not None:
            content = (message.get("content") or [{}])[0]
            text = content.get("text", "")
        tool_traces = [item for item in data.get("output", []) if item.get("type") != "message"]
        return {
            "text": text.strip(),
            "usage": data.get("usage", {}),
            "tool_traces": tool_traces,
            "model": data.get("model"),
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
