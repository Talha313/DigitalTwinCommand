from __future__ import annotations

import uuid

from pydantic import BaseModel, ConfigDict, field_validator


class ORMModel(BaseModel):
    """Response DTO base: reads from ORM objects and renders UUID / enum ids as
    plain strings so the frontend never has to care about Python types."""

    model_config = ConfigDict(from_attributes=True)

    @field_validator("*", mode="before")
    @classmethod
    def _stringify_uuid(cls, value: object) -> object:
        if isinstance(value, uuid.UUID):
            return str(value)
        return value
