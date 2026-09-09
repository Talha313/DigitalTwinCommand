import Link from "next/link";
import { FileBarChart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recentReports } from "@/lib/mock-data/reports";
import type { ReportRecord, ReportStatus } from "@/lib/mock-data/types";

import { DashboardCard } from "./dashboard-card";

type ReportBadgeVariant = "success" | "warning" | "muted" | "danger";

const STATUS_META: Record<
  ReportStatus,
  { label: string; variant: ReportBadgeVariant }
> = {
  ready: { label: "Ready", variant: "success" },
  processing: { label: "Processing", variant: "warning" },
  queued: { label: "Queued", variant: "muted" },
  failed: { label: "Failed", variant: "danger" },
};

export function RecentReports({
  reports = recentReports,
  className,
}: {
  reports?: ReportRecord[];
  className?: string;
}) {
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
                  {report.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {report.createdLabel}
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
    </DashboardCard>
  );
}
