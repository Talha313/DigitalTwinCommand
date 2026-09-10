from __future__ import annotations

from pydantic import BaseModel


class Problem(BaseModel):
    code: str
    message: str


class HealthResponse(BaseModel):
    status: str
    environment: str
    call_llm: str
    chat_llm: str
    lipsync: str
    storage: str
    database: bool
    integrations: dict[str, bool]
