"use client";

import * as React from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatWindow } from "@/components/chat/chat-window";
import { ConversationHeader } from "@/components/chat/conversation-header";
import { ConversationList } from "@/components/chat/conversation-list";
import {
  getConversation,
  listConversations,
  streamChat,
  type ConversationListItem,
  type UiChatMessage,
} from "@/lib/chat";
import { suggestedPrompts } from "@/lib/mock-data/chat";
import { useRolesByIds } from "@/lib/role-context";

function timeNow(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function toUiMessage(row: { id: string; role: string; content: string; created_at: string }): UiChatMessage {
  return {
    id: row.id,
    author: row.role === "user" ? "user" : "twin",
    content: row.content,
    timestamp: new Date(row.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

export function ChatClient() {
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [roleIds, setRoleIds] = React.useState<string[]>([]);
  const [messages, setMessages] = React.useState<UiChatMessage[]>([]);
  const [title, setTitle] = React.useState("New conversation");
  const [input, setInput] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [conversations, setConversations] = React.useState<ConversationListItem[]>([]);

  const streamRef = React.useRef<ReturnType<typeof streamChat> | null>(null);

  const refreshConversations = React.useCallback(async () => {
    try {
      const list = await listConversations();
      setConversations(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  const loadConversation = React.useCallback(async (id: string) => {
    const full = await getConversation(id);
    setConversationId(full.id);
    setRoleIds(full.role_ids);
    setTitle(full.title ?? "Conversation");
    setMessages(full.messages.map(toUiMessage));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await refreshConversations();
        if (cancelled) return;
        const latest = list[0];
        if (latest) await loadConversation(latest.id);
      } catch {
        /* start fresh if this fails — not fatal */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.abort();
    };
  }, [refreshConversations, loadConversation]);

  const selectConversation = (id: string) => {
    if (id === conversationId || isThinking) return;
    streamRef.current?.abort();
    setIsThinking(false);
    void loadConversation(id);
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    const userMessage: UiChatMessage = {
      id: `u-${Date.now()}`,
      author: "user",
      content: trimmed,
      timestamp: timeNow(),
    };
    const assistantId = `t-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, author: "twin", content: "", timestamp: timeNow(), streaming: true },
    ]);
    setInput("");
    setIsThinking(true);

    streamRef.current = streamChat(
      { conversation_id: conversationId ?? undefined, content: trimmed, role_ids: roleIds },
      {
        onEvent: (event) => {
          if (event.type === "start") {
            if (!conversationId) setConversationId(event.conversation_id);
          } else if (event.type === "delta") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + event.text } : m,
              ),
            );
          } else if (event.type === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: event.text, streaming: false }
                  : m,
              ),
            );
            setIsThinking(false);
            void refreshConversations();
          } else if (event.type === "error") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: event.error, streaming: false, error: true }
                  : m,
              ),
            );
            setIsThinking(false);
          }
        },
      },
    );
  };

  const newChat = () => {
    streamRef.current?.abort();
    setConversationId(null);
    setTitle("New conversation");
    setMessages([]);
    setInput("");
    setIsThinking(false);
  };

  const roleNames = useRolesByIds(roleIds).map((role) => role.name);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading conversation…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-72 min-w-0 shrink-0 overflow-hidden border-r border-border/60 md:flex">
        <ConversationList
          conversations={conversations}
          activeId={conversationId}
          onSelect={selectConversation}
          onNewChat={newChat}
        />
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <ConversationHeader
          title={title}
          roleIds={roleIds}
          onRoleIdsChange={setRoleIds}
          onNewChat={newChat}
          messageCount={messages.length}
          conversations={conversations}
          conversationId={conversationId}
          onSelectConversation={selectConversation}
        />
        <ChatWindow
          messages={messages}
          isThinking={isThinking}
          roleNames={roleNames}
          prompts={suggestedPrompts}
          onPromptSelect={setInput}
        />
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={send}
          disabled={isThinking}
          roleCount={roleIds.length}
        />
      </div>
    </div>
  );
}
