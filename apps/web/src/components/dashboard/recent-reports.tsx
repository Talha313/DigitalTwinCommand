"use client";

import * as React from "react";
import Link from "next/link";
import { FileBarChart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listReports,
  type BackendReportStatus,
  type ReportListItem,
} from "@/lib/dashboard";
import { formatRelativeTime } from "@/lib/format";

import { DashboardCard } from "./dashboard-card";

const RECENT_REPORTS_LIMIT = 4;

type ReportBadgeVariant = "success" | "warning" | "muted" | "danger";

const STATUS_META: Record<
  BackendReportStatus,
  { label: string; variant: ReportBadgeVariant }
> = {
  queued: { label: "Queued", variant: "muted" },
  researching: { label: "Researching", variant: "warning" },
  script_ready: { label: "Script ready", variant: "warning" },
  approved: { label: "Approved", variant: "warning" },
  generating: { label: "Generating", variant: "warning" },
  awaiting_avatar: { label: "Awaiting avatar", variant: "warning" },
  ready: { label: "Ready", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
};

/** The pipeline only produces one report type — the daily market report —
 * so there's no per-report title field on the backend to show here. */
const REPORT_TITLE = "Daily Market Report";

export function RecentReports({ className }: { className?: string }) {
  const [reports, setReports] = React.useState<ReportListItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    listReports()
      .then((rows) => {
        if (!cancelled) setReports(rows.slice(0, RECENT_REPORTS_LIMIT));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load reports.",
          );
          setReports([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardCard
      className={className}
      title="Recent reports"
      description="Latest generated briefings"
      action={
        <Link
          href="/reports"
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          View all
        </Link>
      }
    >
      {reports === null ? (
        <p className="text-sm text-muted-foreground">Loading recent reports…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports yet.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => {
            const meta = STATUS_META[report.status];
            return (
              <li
                key={report.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-primary">
                  <FileBarChart className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {REPORT_TITLE}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {formatRelativeTime(report.created_at)}
                  </p>
                </div>
                <Badge variant={meta.variant}>{meta.label}</Badge>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/reports">
                    {report.status === "ready" ? "View report" : "Details"}
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
