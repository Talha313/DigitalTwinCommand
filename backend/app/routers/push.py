from __future__ import annotations

from fastapi import APIRouter, Depends, Response

from app.core.config import settings
from app.db.models.user import User
from app.dependencies import current_user
from app.models.push import PushSubscribeRequest, VapidPublicKey
from app.providers.push import push_client
from app.services.push import PushService, get_push_service

router = APIRouter(prefix="/push", tags=["push"])


@router.get("/vapid-public-key", response_model=VapidPublicKey)
async def vapid_public_key() -> VapidPublicKey:
    return VapidPublicKey(public_key=settings.vapid_public_key, configured=push_client.configured)


@router.post("/subscribe", status_code=204)
async def subscribe(
    body: PushSubscribeRequest,
    user: User = Depends(current_user),
    service: PushService = Depends(get_push_service),
) -> Response:
    await service.subscribe(body, user_id=str(user.id))
    return Response(status_code=204)


@router.post("/unsubscribe", status_code=204)
async def unsubscribe(
    body: dict,
    _: User = Depends(current_user),
    service: PushService = Depends(get_push_service),
) -> Response:
    await service.unsubscribe(body.get("endpoint", ""))
    return Response(status_code=204)
