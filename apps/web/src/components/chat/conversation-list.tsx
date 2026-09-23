"use client";

import { MessageSquare, MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { ConversationListItem } from "@/lib/chat";

export interface ConversationListProps {
  conversations: ConversationListItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  loading?: boolean;
  className?: string;
}

function conversationLabel(item: ConversationListItem): string {
  return item.title?.trim() || "New conversation";
}

function conversationPreview(item: ConversationListItem): string {
  if (item.message_count === 0) return "No messages yet";
  return `${item.message_count} message${item.message_count === 1 ? "" : "s"}`;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  loading,
  className,
}: ConversationListProps) {
  return (
    <div className={cn("flex h-full min-w-0 w-full flex-col", className)}>
      <div className="shrink-0 border-b border-border/60 p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onNewChat}
          className="w-full justify-start gap-2"
        >
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          New chat
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-4 text-xs text-muted-foreground">
            Loading conversations…
          </p>
        ) : conversations.length === 0 ? (
          <p className="px-4 py-4 text-xs text-muted-foreground">
            No previous chats yet.
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {conversations.map((item) => {
              const active = item.id === activeId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      active
                        ? "bg-primary/10"
                        : "hover:bg-accent",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                        active
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                      aria-hidden
                    >
                      <MessageSquare className="h-5 w-5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "min-w-0 truncate text-sm font-medium",
                            active ? "text-foreground" : "text-foreground/90",
                          )}
                        >
                          {conversationLabel(item)}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatRelativeTime(item.updated_at)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {conversationPreview(item)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
