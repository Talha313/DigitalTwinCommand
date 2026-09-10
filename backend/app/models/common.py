from __future__ import annotations

from pydantic import BaseModel


class Problem(BaseModel):
    code: str
    message: str


class HealthResponse(BaseModel):
    status: str
    model: str
