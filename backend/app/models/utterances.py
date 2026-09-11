from __future__ import annotations

from datetime import datetime

from app.db.models.enums import UtteranceSource, UtteranceSpeaker
from app.models.base import ORMModel


class UtteranceRead(ORMModel):
    """One transcript line."""

    id: str
    call_id: str
    speaker: UtteranceSpeaker
    text: str
    source: UtteranceSource | None = None
    timestamp: datetime | None = None
    created_at: datetime
