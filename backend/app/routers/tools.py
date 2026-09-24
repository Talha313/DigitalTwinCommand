"""Custom tools the live ElevenLabs phone agent calls directly during a call
(distinct from our own dashboard/report pipeline). These are plain HTTP
webhooks configured in ElevenLabs' agent → Tools screen, pointed at us
instead of straight at a vendor API, so provider keys live in our own server
.env instead of inside ElevenLabs' dashboard."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import UpstreamError
from app.providers.anthropic_client import anthropic_client

log = get_logger(__name__)

router = APIRouter(prefix="/webhooks/tools", tags=["tools"])


class WebSearchRequest(BaseModel):
    query: str


@router.post("/web-search")
async def web_search(
    body: WebSearchRequest,
    x_tools_secret: str | None = Header(default=None),
) -> dict:
    if not settings.tools_shared_secret or x_tools_secret != settings.tools_shared_secret:
        raise HTTPException(status_code=401, detail="invalid tools secret")

    try:
        result = await anthropic_client.complete(
            system=(
                "Search the web and answer the caller's question in 2-4 "
                "plain spoken sentences. This will be read aloud on a live "
                "phone call, so respond in plain speech only — no markdown, "
                "no links, no citation markers."
            ),
            messages=[{"role": "user", "content": body.query}],
            model=settings.anthropic_tools_model,
            max_tokens=600,
            web_search=True,
        )
    except UpstreamError as exc:
        log.warning("tools/web-search failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"text": result["text"]}
