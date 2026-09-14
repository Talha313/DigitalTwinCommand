"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  listCalls,
  toUiDirection,
  type BackendCallStatus,
  type CallRead,
} from "@/lib/calls";
import { formatDuration, formatRelativeTime } from "@/lib/format";

import { DashboardCard } from "./dashboard-card";

const RECENT_CALLS_LIMIT = 5;

type CallBadgeVariant = "success" | "warning" | "danger" | "muted";

const STATUS_META: Record<
  BackendCallStatus,
  { label: string; variant: CallBadgeVariant }
> = {
  queued: { label: "Queued", variant: "muted" },
  ringing: { label: "Ringing", variant: "warning" },
  in_progress: { label: "In progress", variant: "warning" },
  connected: { label: "Connected", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
  no_answer: { label: "No answer", variant: "muted" },
  canceled: { label: "Canceled", variant: "muted" },
};

/** Calls have no caller-name field on the backend — show the counterparty
 * number instead, same as the live-call panel (see hooks/use-live-call.ts). */
function callerLabel(call: CallRead): string {
  const inbound = toUiDirection(call.direction) === "inbound";
  return (inbound ? call.from_e164 : call.to_e164) ?? "Unknown";
}

function directionLabel(call: CallRead): string {
  return toUiDirection(call.direction) === "inbound" ? "Inbound" : "Outbound";
}

function durationLabel(call: CallRead): string {
  return call.duration_seconds != null
    ? formatDuration(call.duration_seconds)
    : "—";
}

export function RecentCalls({ className }: { className?: string }) {
  const [calls, setCalls] = React.useState<CallRead[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    listCalls()
      .then((rows) => {
        if (!cancelled) setCalls(rows.slice(0, RECENT_CALLS_LIMIT));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load calls.");
          setCalls([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardCard
      className={className}
      title="Recent calls"
      description="Last handled conversations"
      contentClassName="p-0"
      action={
        <Link
          href="/calls/history"
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          View all
        </Link>
      }
    >
      {calls === null ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          Loading recent calls…
        </p>
      ) : error ? (
        <p className="px-5 py-6 text-sm text-destructive">{error}</p>
      ) : calls.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          No calls yet.
        </p>
      ) : (
        <>
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">
                  Caller
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Direction
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Duration
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {calls.map((call) => {
                const meta = STATUS_META[call.status];
                return (
                  <tr
                    key={call.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      {callerLabel(call)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {directionLabel(call)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">
                      {durationLabel(call)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatRelativeTime(call.started_at ?? call.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <ul className="divide-y divide-border/50 md:hidden">
            {calls.map((call) => {
              const meta = STATUS_META[call.status];
              return (
                <li
                  key={call.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {callerLabel(call)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {directionLabel(call)} &middot; {durationLabel(call)}{" "}
                      &middot; {formatRelativeTime(call.started_at ?? call.created_at)}
                    </p>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </DashboardCard>
  );
}
