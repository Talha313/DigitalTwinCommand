"use client";

import * as React from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatWindow } from "@/components/chat/chat-window";
import { ConversationHeader } from "@/components/chat/conversation-header";
import {
  chatConversation,
  previewReplies,
  suggestedPrompts,
} from "@/lib/mock-data/chat";
import type { ChatMessage } from "@/lib/mock-data/types";
import { rolesByIds } from "@/lib/role-context";

function timeNow(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ChatClient() {
  const [roleIds, setRoleIds] = React.useState<string[]>(
    chatConversation.roleIds,
  );
  const [messages, setMessages] = React.useState<ChatMessage[]>(
    chatConversation.messages,
  );
  const [input, setInput] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyIndexRef = React.useRef(0);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      author: "user",
      content: trimmed,
      timestamp: timeNow(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    timerRef.current = setTimeout(() => {
      const index = replyIndexRef.current % previewReplies.length;
      replyIndexRef.current += 1;
      const twinMessage: ChatMessage = {
        id: `t-${Date.now()}`,
        author: "twin",
        content: previewReplies[index] ?? "UI preview.",
        timestamp: timeNow(),
        roleId: roleIds[0],
      };
      setMessages((prev) => [...prev, twinMessage]);
      setIsThinking(false);
    }, 1400);
  };

  const newChat = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessages([]);
    setInput("");
    setIsThinking(false);
  };

  const roleNames = rolesByIds(roleIds).map((role) => role.name);

  return (
    <div className="flex h-full flex-col">
      <ConversationHeader
        title={chatConversation.title}
        roleIds={roleIds}
        onRoleIdsChange={setRoleIds}
        onNewChat={newChat}
        messageCount={messages.length}
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
  );
}
