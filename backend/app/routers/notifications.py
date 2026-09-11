from __future__ import annotations

from fastapi import APIRouter, Depends, Response

from app.db.models.user import User
from app.dependencies import current_user
from app.models.notifications import NotificationRead
from app.services.notifications import NotificationService, get_notifications_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    user: User = Depends(current_user),
    service: NotificationService = Depends(get_notifications_service),
) -> list[NotificationRead]:
    return await service.list_for_user(str(user.id))


@router.post("/{notification_id}/read", response_model=NotificationRead)
async def mark_notification_read(
    notification_id: str,
    user: User = Depends(current_user),
    service: NotificationService = Depends(get_notifications_service),
) -> NotificationRead:
    return await service.mark_read(notification_id, user_id=str(user.id))


@router.post("/mark-all-read", status_code=204)
async def mark_all_read(
    user: User = Depends(current_user),
    service: NotificationService = Depends(get_notifications_service),
) -> Response:
    await service.mark_all_read(str(user.id))
    return Response(status_code=204)
