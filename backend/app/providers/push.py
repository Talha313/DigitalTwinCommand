"""Web-push (VAPID) delivery to installed PWAs."""
from __future__ import annotations

import asyncio
import json

from pywebpush import WebPushException, webpush

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import NotConfiguredError

log = get_logger(__name__)


class PushClient:
    @property
    def configured(self) -> bool:
        return bool(settings.vapid_private_key and settings.vapid_public_key)

    async def send(self, subscription: dict, payload: dict) -> bool:
        """Returns False if the subscription is gone (410/404) and should be pruned."""
        if not self.configured:
            raise NotConfiguredError("VAPID keys are not configured.")

        def _send() -> int:
            try:
                webpush(
                    subscription_info=subscription,
                    data=json.dumps(payload),
                    vapid_private_key=settings.vapid_private_key,
                    vapid_claims={"sub": settings.vapid_subject},
                    ttl=60,
                )
                return 201
            except WebPushException as exc:
                return exc.response.status_code if exc.response is not None else 500

        status = await asyncio.to_thread(_send)
        if status in {404, 410}:
            return False
        if status >= 400:
            log.warning("web push failed status=%s", status)
        return True


push_client = PushClient()
