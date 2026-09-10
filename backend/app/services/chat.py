from __future__ import annotations

import json
from collections.abc import AsyncIterator

from app.core.logging import get_logger
from app.db.models.enums import MessageRole
from app.db.session import session_scope
from app.errors import AppError
from app.models.chat import ChatRequest
from app.models.conversations import ConversationCreate, MessageCreate
from app.providers.anthropic_client import anthropic_client
from app.services.conversations import ConversationService
from app.services.prompting import build_system_prompt
from app.services.roles import load_roles_for_prompt

log = get_logger(__name__)

_HISTORY_LIMIT = 40


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


class ChatService:
    """Backs POST /api/chat/stream — dashboard text chat with the twin."""

    async def stream(self, req: ChatRequest, *, user_id: str | None) -> AsyncIterator[str]:
        try:
            conversation_id, history, system = await self._prepare(req, user_id)
        except AppError as exc:
            yield _sse({"type": "error", "error": exc.message})
            return

        yield _sse({"type": "start", "conversation_id": conversation_id})

        chunks: list[str] = []
        try:
            async for delta in anthropic_client.stream_chat(
                system=system,
                messages=history,
                temperature=0.7,
            ):
                chunks.append(delta)
                yield _sse({"type": "delta", "text": delta})
        except AppError as exc:
            yield _sse({"type": "error", "error": exc.message})
            return
        except Exception:  # noqa: BLE001
            log.exception("chat stream crashed")
            yield _sse({"type": "error", "error": "The twin is unavailable right now."})
            return

        answer = "".join(chunks).strip()
        message_id = await self._persist_reply(conversation_id, answer, req.role_ids)
        yield _sse(
            {
                "type": "done",
                "conversation_id": conversation_id,
                "message_id": message_id,
                "text": answer,
            }
        )

    async def _prepare(
        self, req: ChatRequest, user_id: str | None
    ) -> tuple[str, list[dict], str]:
        async with session_scope() as session:
            svc = ConversationService(session)
            if req.conversation_id:
                conv = await svc.get(req.conversation_id)
                conversation_id = conv.id
                role_ids = req.role_ids or conv.role_ids
            else:
                conv = await svc.create(
                    ConversationCreate(
                        title=req.title or req.content[:60], role_ids=req.role_ids
                    ),
                    user_id=user_id,
                )
                conversation_id = conv.id
                role_ids = req.role_ids

            await svc.add_message(
                conversation_id, MessageCreate(content=req.content), role=MessageRole.USER
            )

            messages = await svc.list_messages(conversation_id)
            history = [
                {"role": m.role.value, "content": m.content}
                for m in messages[-_HISTORY_LIMIT:]
                if m.role.value in ("user", "assistant")
            ]

            roles = await load_roles_for_prompt(session, role_ids) if role_ids else []
            system = build_system_prompt(roles, channel="chat")
        return conversation_id, history, system

    async def _persist_reply(
        self, conversation_id: str, text: str, role_ids: list[str]
    ) -> str:
        if not text:
            return ""
        async with session_scope() as session:
            svc = ConversationService(session)
            msg = await svc.add_message(
                conversation_id,
                MessageCreate(
                    content=text,
                    meta={"role_ids": role_ids} if role_ids else None,
                ),
                role=MessageRole.ASSISTANT,
            )
            return msg.id


def get_chat_service() -> ChatService:
    return ChatService()
