from __future__ import annotations

from fastapi import APIRouter, Depends, Response

from app.models.conversations import (
    ConversationCreate,
    ConversationListItem,
    ConversationRead,
    ConversationRolesUpdate,
    ConversationUpdate,
    MessageCreate,
    MessageRead,
)
from app.services.conversations import ConversationService, get_conversations_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationListItem])
async def list_conversations(
    service: ConversationService = Depends(get_conversations_service),
) -> list[ConversationListItem]:
    return await service.list_conversations()


@router.post("", response_model=ConversationRead, status_code=201)
async def create_conversation(
    body: ConversationCreate,
    service: ConversationService = Depends(get_conversations_service),
) -> ConversationRead:
    return await service.create(body)


@router.get("/{conversation_id}", response_model=ConversationRead)
async def get_conversation(
    conversation_id: str,
    service: ConversationService = Depends(get_conversations_service),
) -> ConversationRead:
    return await service.get(conversation_id)


@router.patch("/{conversation_id}", response_model=ConversationRead)
async def update_conversation(
    conversation_id: str,
    body: ConversationUpdate,
    service: ConversationService = Depends(get_conversations_service),
) -> ConversationRead:
    return await service.update(conversation_id, body)


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    service: ConversationService = Depends(get_conversations_service),
) -> Response:
    await service.delete(conversation_id)
    return Response(status_code=204)


@router.put("/{conversation_id}/roles", response_model=ConversationRead)
async def set_conversation_roles(
    conversation_id: str,
    body: ConversationRolesUpdate,
    service: ConversationService = Depends(get_conversations_service),
) -> ConversationRead:
    return await service.set_roles(conversation_id, body)


# --- messages ---


@router.get("/{conversation_id}/messages", response_model=list[MessageRead])
async def list_messages(
    conversation_id: str,
    service: ConversationService = Depends(get_conversations_service),
) -> list[MessageRead]:
    return await service.list_messages(conversation_id)


@router.post("/{conversation_id}/messages", response_model=MessageRead, status_code=201)
async def post_message(
    conversation_id: str,
    body: MessageCreate,
    service: ConversationService = Depends(get_conversations_service),
) -> MessageRead:
    return await service.add_message(conversation_id, body)
