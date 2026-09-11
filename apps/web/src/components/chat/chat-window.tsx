"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { MessageBubble } from "./message-bubble";
import { EmptyChatState } from "./empty-chat-state";
import { TypingIndicator } from "./typing-indicator";
import type { UiChatMessage } from "@/lib/chat";

export interface ChatWindowProps {
  messages: UiChatMessage[];
  isThinking: boolean;
  roleNames: string[];
  prompts: string[];
  onPromptSelect: (prompt: string) => void;
}

export function ChatWindow({
  messages,
  isThinking,
  roleNames,
  prompts,
  onPromptSelect,
}: ChatWindowProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking]);

  if (messages.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EmptyChatState
          roleNames={roleNames}
          prompts={prompts}
          onPromptSelect={onPromptSelect}
        />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isThinking ? (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-500">
              <Sparkles
                className="h-4 w-4 text-primary-foreground"
                aria-hidden
              />
            </span>
            <TypingIndicator />
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
