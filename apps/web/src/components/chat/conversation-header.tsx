"use client";

import * as React from "react";
import { History, MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RiskBadge } from "@/components/roles/risk-badge";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { useCombinedRisk, useRolesByIds } from "@/lib/role-context";
import type { ConversationListItem } from "@/lib/chat";

import { ChatRoleSelector } from "./role-selector";
import { ConversationList } from "./conversation-list";

export interface ConversationHeaderProps {
  title: string;
  roleIds: string[];
  onRoleIdsChange: (roleIds: string[]) => void;
  onNewChat: () => void;
  messageCount: number;
  conversations: ConversationListItem[];
  conversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export function ConversationHeader({
  title,
  roleIds,
  onRoleIdsChange,
  onNewChat,
  messageCount,
  conversations,
  conversationId,
  onSelectConversation,
}: ConversationHeaderProps) {
  const activeRoles = useRolesByIds(roleIds);
  const risk = useCombinedRisk(roleIds);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  return (
    <div className="shrink-0 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 md:hidden"
                aria-label="Previous chats"
              >
                <History className="h-4.5 w-4.5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0" aria-describedby={undefined}>
              <SheetTitle className="sr-only">Previous chats</SheetTitle>
              <ConversationList
                conversations={conversations}
                activeId={conversationId}
                onSelect={(id) => {
                  onSelectConversation(id);
                  setHistoryOpen(false);
                }}
                onNewChat={() => {
                  onNewChat();
                  setHistoryOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {messageCount > 0
                ? `${messageCount} message${messageCount > 1 ? "s" : ""}`
                : "New conversation"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ChatRoleSelector value={roleIds} onChange={onRoleIdsChange} />
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChat}
            className="gap-1.5"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">New chat</span>
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-2 w-full max-w-3xl">
        {activeRoles.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeRoles.map((role) => (
              <RoleBadge key={role.id} name={role.name} />
            ))}
            <RiskBadge level={risk} className="ml-1" />
          </div>
        ) : (
          <p className="text-xs text-amber-300">
            No roles selected — pick at least one for the Twin to use.
          </p>
        )}
      </div>
    </div>
  );
}
