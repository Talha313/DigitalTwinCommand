from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.models.enums import UtteranceSource, UtteranceSpeaker


class UtteranceRead(BaseModel):
    """One transcript line."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    call_id: str
    speaker: UtteranceSpeaker
    text: str
    source: UtteranceSource | None = None
    timestamp: datetime | None = None
    created_at: datetime
