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

const MAX_ROLE_CHIPS = 2;

export interface CallHistoryTableProps {
  calls: CallHistoryEntry[];
  onOpen: (id: string) => void;
}

export function CallHistoryTable({ calls, onOpen }: CallHistoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
      <table className="w-full min-w-[46rem] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-4 py-3 font-medium">Caller</th>
            <th scope="col" className="px-4 py-3 font-medium">Direction</th>
            <th scope="col" className="px-4 py-3 font-medium">Roles</th>
            <th scope="col" className="px-4 py-3 font-medium">Duration</th>
            <th scope="col" className="px-4 py-3 font-medium">Outcome</th>
            <th scope="col" className="px-4 py-3 font-medium">Date</th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {calls.map((call) => {
            const roles = rolesByIds(call.roleIds);
            const shown = roles.slice(0, MAX_ROLE_CHIPS);
            const extra = roles.length - shown.length;
            const DirectionIcon =
              call.direction === "inbound" ? ArrowDownLeft : ArrowUpRight;

            return (
              <tr
                key={call.id}
                onClick={() => onOpen(call.id)}
                className="cursor-pointer transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusDot tone={STATUS_TONE[call.status]} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {call.caller}
                      </p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {call.direction === "inbound"
                          ? call.fromNumber
                          : call.toNumber}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <DirectionIcon className="h-3.5 w-3.5" aria-hidden />
                    {call.direction === "inbound" ? "Inbound" : "Outbound"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {shown.map((role) => (
                      <RoleBadge key={role.id} name={role.name} />
                    ))}
                    {extra > 0 ? (
                      <span className="rounded-md border border-border/60 bg-background/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        +{extra}
                      </span>
                    ) : null}
                    {roles.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">
                  {formatDuration(call.durationSeconds)}
                </td>
                <td className="px-4 py-3">
                  <OutcomeBadge outcome={call.outcome} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {call.dateLabel}, {call.startedAtLabel}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(call.id);
                    }}
                  >
                    Review
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
