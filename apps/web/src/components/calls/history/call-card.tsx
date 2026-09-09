"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { rolesByIds } from "@/lib/role-context";
import { formatDuration } from "@/lib/format";
import type { CallHistoryEntry, CallStatus } from "@/lib/mock-data/types";

import { OutcomeBadge } from "./outcome-badge";

const STATUS_TONE: Record<
  CallStatus,
  "positive" | "warning" | "critical" | "neutral"
> = {
  completed: "positive",
  missed: "neutral",
  "in-progress": "warning",
  failed: "critical",
};

export interface CallCardProps {
  call: CallHistoryEntry;
  onOpen: () => void;
}

export function CallCard({ call, onOpen }: CallCardProps) {
  const roles = rolesByIds(call.roleIds);
  const DirectionIcon =
    call.direction === "inbound" ? ArrowDownLeft : ArrowUpRight;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot tone={STATUS_TONE[call.status]} />
            <p className="truncate text-sm font-medium text-foreground">
              {call.caller}
            </p>
          </div>
          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
            {call.direction === "inbound" ? call.fromNumber : call.toNumber}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <DirectionIcon className="h-3 w-3" aria-hidden />
            {call.dateLabel}
          </span>
          <p className="mt-0.5 font-mono tabular-nums">
            {formatDuration(call.durationSeconds)}
          </p>
        </div>
      </div>

      {roles.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {roles.map((role) => (
            <RoleBadge key={role.id} name={role.name} />
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <OutcomeBadge outcome={call.outcome} />
        <Button variant="outline" size="sm" onClick={onOpen}>
          Review
        </Button>
      </div>
    </div>
  );
}
