"use client";

import * as React from "react";
import { FileBarChart, PhoneCall, type LucideIcon } from "lucide-react";

import { listCalls, toUiDirection, type CallRead } from "@/lib/calls";
import { listReports, type ReportListItem } from "@/lib/dashboard";
import { formatRelativeTime } from "@/lib/format";

import { DashboardCard } from "./dashboard-card";

const FEED_LIMIT = 6;
const SOURCE_LIMIT = 10;

type ActivityKind = "call" | "report";

interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  timestamp: string;
}

const KIND_ICON: Record<ActivityKind, LucideIcon> = {
  call: PhoneCall,
  report: FileBarChart,
};

const CALL_STATUS_LABEL: Record<CallRead["status"], string> = {
  queued: "Queued",
  ringing: "Ringing",
  in_progress: "In-progress",
  connected: "Connected",
  completed: "Completed",
  failed: "Failed",
  no_answer: "Missed",
  canceled: "Canceled",
};

const REPORT_STATUS_LABEL: Record<ReportListItem["status"], string> = {
  queued: "queued",
  researching: "researching",
  script_ready: "script ready",
  approved: "approved",
  generating: "generating",
  awaiting_avatar: "awaiting avatar",
  ready: "ready",
  failed: "failed",
};

function callActivity(call: CallRead): ActivityItem {
  const inbound = toUiDirection(call.direction) === "inbound";
  const number = (inbound ? call.from_e164 : call.to_e164) ?? "unknown number";
  const label = CALL_STATUS_LABEL[call.status];
  return {
    id: `call-${call.id}`,
    kind: "call",
    title: `${label} call ${inbound ? "from" : "to"} ${number}`,
    timestamp: call.ended_at ?? call.started_at ?? call.created_at,
  };
}

function reportActivity(report: ReportListItem): ActivityItem {
  return {
    id: `report-${report.id}`,
    kind: "report",
    title: `Report ${REPORT_STATUS_LABEL[report.status]}`,
    timestamp: report.created_at,
  };
}

/**
 * There's no audit-log / activity-feed endpoint on the backend, so this is
 * composed client-side from real, timestamped events we already fetch
 * elsewhere on this page (recent calls + recent reports) rather than a
 * fabricated feed. Only "call" and "report" kinds appear as a result —
 * there's no real source yet for role-assignment or system/voice events.
 */
export function ActivityFeed({ className }: { className?: string }) {
  const [items, setItems] = React.useState<ActivityItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    Promise.all([listCalls(), listReports()])
      .then(([calls, reports]) => {
        if (cancelled) return;
        const combined = [
          ...calls.slice(0, SOURCE_LIMIT).map(callActivity),
          ...reports.slice(0, SOURCE_LIMIT).map(reportActivity),
        ].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        setItems(combined.slice(0, FEED_LIMIT));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load recent activity.",
          );
          setItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardCard
      className={className}
      title="Recent activity"
      description="Latest Twin events"
    >
      {items === null ? (
        <p className="text-sm text-muted-foreground">Loading recent activity…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <ol className="relative space-y-5 before:absolute before:left-[0.5625rem] before:top-1 before:h-[calc(100%-1rem)] before:w-px before:bg-border/70">
          {items.map((entry) => {
            const Icon = KIND_ICON[entry.kind];
            return (
              <li key={entry.id} className="relative flex gap-3.5">
                <span className="relative z-10 flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center rounded-full border border-border/70 bg-card">
                  <Icon className="h-3 w-3 text-primary" aria-hidden />
                </span>
                <div className="-mt-0.5 min-w-0">
                  <p className="text-sm text-foreground">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(entry.timestamp)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </DashboardCard>
  );
}
