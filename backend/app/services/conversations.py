from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import db_session
from app.errors import NotImplementedYet
from app.models.conversations import (
    ConversationCreate,
    ConversationListItem,
    ConversationRead,
    ConversationRolesUpdate,
    ConversationUpdate,
    MessageCreate,
    MessageRead,
)
from app.services.base import Service


class ConversationService(Service):
    async def list_conversations(self) -> list[ConversationListItem]:
        raise NotImplementedYet("Conversations are not implemented yet.")

    async def create(self, data: ConversationCreate) -> ConversationRead:
        raise NotImplementedYet("Conversations are not implemented yet.")

    async def get(self, conversation_id: str) -> ConversationRead:
        raise NotImplementedYet("Conversations are not implemented yet.")

    async def update(
        self, conversation_id: str, data: ConversationUpdate
    ) -> ConversationRead:
        raise NotImplementedYet("Conversations are not implemented yet.")

    async def delete(self, conversation_id: str) -> None:
        raise NotImplementedYet("Conversations are not implemented yet.")

    async def set_roles(
        self, conversation_id: str, data: ConversationRolesUpdate
    ) -> ConversationRead:
        raise NotImplementedYet("Conversations are not implemented yet.")

    # --- messages ---

    async def list_messages(self, conversation_id: str) -> list[MessageRead]:
        raise NotImplementedYet("Messages are not implemented yet.")

    async def add_message(
        self, conversation_id: str, data: MessageCreate
    ) -> MessageRead:
        raise NotImplementedYet("Messages are not implemented yet.")


def get_conversations_service(
    session: AsyncSession = Depends(db_session),
) -> ConversationService:
    return ConversationService(session)
