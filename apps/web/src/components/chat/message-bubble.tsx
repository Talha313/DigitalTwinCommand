import { Sparkles } from "lucide-react";

import type { UiChatMessage } from "@/lib/chat";

export interface MessageBubbleProps {
  message: UiChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.author === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-primary/20 bg-primary/10 px-3.5 py-2.5 sm:max-w-[75%]">
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {message.content}
          </p>
          <p className="mt-1 text-right text-[11px] text-muted-foreground">
            {message.timestamp}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-500">
        <Sparkles className="h-4 w-4 text-primary-foreground" aria-hidden />
      </span>
      <div className="min-w-0 max-w-[85%] sm:max-w-[80%]">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-foreground">Digital Twin</span>
        </div>

        <div
          className={
            message.error
              ? "rounded-2xl rounded-tl-sm border border-destructive/40 bg-destructive/10 px-3.5 py-2.5"
              : "rounded-2xl rounded-tl-sm border border-border/60 bg-card px-3.5 py-2.5"
          }
        >
          <p
            className={
              message.error
                ? "whitespace-pre-wrap text-sm text-destructive"
                : "whitespace-pre-wrap text-sm text-foreground"
            }
          >
            {message.content}
            {message.streaming ? (
              <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-current align-middle" />
            ) : null}
          </p>
        </div>

        <p className="mt-1 text-[11px] text-muted-foreground">{message.timestamp}</p>
      </div>
    </div>
  );
}
