"use client";

import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { useRolesByIds } from "@/lib/role-context";
import { formatDuration } from "@/lib/format";
import {
  callTimestamp,
  counterpartyNumber,
  formatCallTimestamp,
  toUiStatus,
  type UiCallStatus,
} from "@/lib/call-history";
import { toUiDirection, type CallRead } from "@/lib/calls";

import { OutcomeBadge } from "./outcome-badge";

const STATUS_TONE: Record<
  UiCallStatus,
  "positive" | "warning" | "critical" | "neutral"
> = {
  completed: "positive",
  missed: "neutral",
  "in-progress": "warning",
  failed: "critical",
};

export interface CallCardProps {
  call: CallRead;
  onOpen: () => void;
}

export function CallCard({ call, onOpen }: CallCardProps) {
  const router = useRouter();
  const roles = useRolesByIds(call.role_ids);
  const direction = toUiDirection(call.direction);
  const DirectionIcon = direction === "inbound" ? ArrowDownLeft : ArrowUpRight;
  const number = counterpartyNumber(call);
  const canCall = number !== "Unknown";

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot tone={STATUS_TONE[toUiStatus(call.status)]} />
            <p className="truncate font-mono text-sm font-medium text-foreground">
              {counterpartyNumber(call)}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <DirectionIcon className="h-3 w-3" aria-hidden />
            {formatCallTimestamp(callTimestamp(call))}
          </span>
          <p className="mt-0.5 font-mono tabular-nums">
            {formatDuration(call.duration_seconds ?? 0)}
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
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            disabled={!canCall}
            aria-label={`Call ${number}`}
            title={canCall ? `Call ${number}` : "No number available"}
            onClick={() => router.push(`/calls/live?dial=${encodeURIComponent(number)}`)}
          >
            <Phone className="h-4 w-4" aria-hidden />
          </Button>
          <Button variant="outline" size="sm" onClick={onOpen}>
            Review
          </Button>
        </div>
      </div>
    </div>
  );
}
