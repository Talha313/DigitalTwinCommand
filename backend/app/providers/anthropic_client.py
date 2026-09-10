"""Anthropic Messages API — used for the dashboard chat, the daily-report
research + scriptwriting, and grading. The live phone agent's LLM is Claude
hosted *by ElevenLabs* and is not called from here."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from anthropic import APIError, AsyncAnthropic

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import NotConfiguredError, UpstreamError

log = get_logger(__name__)

_WEB_SEARCH_TOOL = {"type": "web_search_20250305", "name": "web_search", "max_uses": 8}


class AnthropicClient:
    def __init__(self) -> None:
        self._client: AsyncAnthropic | None = None

    @property
    def configured(self) -> bool:
        return bool(settings.anthropic_api_key)

    def _c(self) -> AsyncAnthropic:
        if not self.configured:
            raise NotConfiguredError("ANTHROPIC_API_KEY is not set.")
        if self._client is None:
            self._client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        return self._client

    async def stream_chat(
        self,
        *,
        system: str,
        messages: list[dict[str, Any]],
        model: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> AsyncIterator[str]:
        """Yield assistant text deltas."""
        try:
            async with self._c().messages.stream(
                model=model or settings.anthropic_chat_model,
                max_tokens=max_tokens or settings.anthropic_max_tokens,
                system=system,
                messages=messages,
                **({"temperature": temperature} if temperature is not None else {}),
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except APIError as exc:
            log.exception("anthropic stream failed")
            raise UpstreamError(f"Anthropic error: {exc}") from exc

    async def complete(
        self,
        *,
        system: str,
        messages: list[dict[str, Any]],
        model: str | None = None,
        max_tokens: int | None = None,
        web_search: bool = False,
    ) -> dict[str, Any]:
        """Non-streaming call. Returns {text, usage, tool_traces}."""
        try:
            resp = await self._c().messages.create(
                model=model or settings.anthropic_report_model,
                max_tokens=max_tokens or settings.anthropic_max_tokens,
                system=system,
                messages=messages,
                tools=[_WEB_SEARCH_TOOL] if web_search else [],
            )
        except APIError as exc:
            log.exception("anthropic complete failed")
            raise UpstreamError(f"Anthropic error: {exc}") from exc

        text_parts: list[str] = []
        traces: list[dict[str, Any]] = []
        for block in resp.content:
            btype = getattr(block, "type", None)
            if btype == "text":
                text_parts.append(block.text)
            elif btype in {"server_tool_use", "web_search_tool_result"}:
                traces.append(block.model_dump(mode="json"))
        return {
            "text": "".join(text_parts).strip(),
            "usage": resp.usage.model_dump(mode="json") if resp.usage else {},
            "tool_traces": traces,
            "model": resp.model,
        }


anthropic_client = AnthropicClient()
