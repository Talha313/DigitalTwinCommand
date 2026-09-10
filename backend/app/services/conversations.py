from __future__ import annotations

from fastapi import Depends
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.conversation import Conversation
from app.db.models.enums import MessageRole
from app.db.models.message import Message
from app.db.models.role import conversation_roles
from app.dependencies import db_session
from app.models.conversations import (
    ConversationCreate,
    ConversationListItem,
    ConversationRead,
    ConversationRolesUpdate,
    ConversationUpdate,
    MessageCreate,
    MessageRead,
)
from app.services.base import Service, as_uuid
from app.services.roles import load_roles_for_prompt


class ConversationService(Service):
    async def _role_ids(self, conversation_id) -> list[str]:
        rows = (
            await self.session.execute(
                select(conversation_roles.c.role_id).where(
                    conversation_roles.c.conversation_id == as_uuid(conversation_id)
                )
            )
        ).scalars()
        return [str(r) for r in rows]

    async def _set_role_ids(self, conversation_id, role_ids: list[str]) -> None:
        if role_ids:
            await load_roles_for_prompt(self.session, role_ids)  # validates
        await self.session.execute(
            delete(conversation_roles).where(
                conversation_roles.c.conversation_id == as_uuid(conversation_id)
            )
        )
        for rid in dict.fromkeys(role_ids):
            await self.session.execute(
                conversation_roles.insert().values(
                    conversation_id=as_uuid(conversation_id), role_id=as_uuid(rid)
                )
            )

    async def _read(self, conversation_id) -> ConversationRead:
        conv = await self._get(
            Conversation,
            conversation_id,
            options=[selectinload(Conversation.messages)],
            label="Conversation",
        )
        data = ConversationRead.model_validate(conv)
        data.role_ids = await self._role_ids(conversation_id)
        return data

    async def list_conversations(self, user_id: str | None = None) -> list[ConversationListItem]:
        counts = (
            select(Message.conversation_id, func.count().label("n"))
            .group_by(Message.conversation_id)
            .subquery()
        )
        stmt = (
            select(Conversation, func.coalesce(counts.c.n, 0))
            .outerjoin(counts, counts.c.conversation_id == Conversation.id)
            .order_by(Conversation.updated_at.desc())
        )
        if user_id:
            stmt = stmt.where(Conversation.user_id == as_uuid(user_id))
        rows = (await self.session.execute(stmt)).all()
        out = []
        for conv, n in rows:
            item = ConversationListItem.model_validate(conv)
            item.message_count = int(n)
            item.role_ids = await self._role_ids(conv.id)
            out.append(item)
        return out

    async def create(self, data: ConversationCreate, *, user_id: str | None = None) -> ConversationRead:
        conv = Conversation(title=data.title, user_id=as_uuid(user_id) if user_id else None)
        self.session.add(conv)
        await self.session.flush()
        await self._set_role_ids(conv.id, data.role_ids)
        await self.session.flush()
        return await self._read(conv.id)

    async def get(self, conversation_id: str) -> ConversationRead:
        return await self._read(conversation_id)

    async def update(self, conversation_id: str, data: ConversationUpdate) -> ConversationRead:
        conv = await self._get(Conversation, conversation_id, label="Conversation")
        patch = data.model_dump(exclude_unset=True)
        if "title" in patch:
            conv.title = patch["title"]
        await self.session.flush()
        return await self._read(conversation_id)

    async def delete(self, conversation_id: str) -> None:
        conv = await self._get(Conversation, conversation_id, label="Conversation")
        await self.session.delete(conv)

    async def set_roles(self, conversation_id: str, data: ConversationRolesUpdate) -> ConversationRead:
        await self._get(Conversation, conversation_id, label="Conversation")
        await self._set_role_ids(conversation_id, data.role_ids)
        await self.session.flush()
        return await self._read(conversation_id)

    async def list_messages(self, conversation_id: str) -> list[MessageRead]:
        await self._get(Conversation, conversation_id, label="Conversation")
        rows = (
            await self.session.execute(
                select(Message)
                .where(Message.conversation_id == as_uuid(conversation_id))
                .order_by(Message.created_at)
            )
        ).scalars().all()
        return [MessageRead.model_validate(r) for r in rows]

    async def add_message(
        self, conversation_id: str, data: MessageCreate, *, role: MessageRole = MessageRole.USER
    ) -> MessageRead:
        await self._get(Conversation, conversation_id, label="Conversation")
        msg = Message(
            conversation_id=as_uuid(conversation_id),
            role=role,
            content=data.content,
            meta=data.meta,
        )
        self.session.add(msg)
        await self.session.execute(
            Conversation.__table__.update()
            .where(Conversation.id == as_uuid(conversation_id))
            .values(updated_at=func.now())
        )
        await self.session.flush()
        return MessageRead.model_validate(msg)


def get_conversations_service(
    session: AsyncSession = Depends(db_session),
) -> ConversationService:
    return ConversationService(session)
