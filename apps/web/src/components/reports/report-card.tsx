"use client";

import Link from "next/link";
import { CalendarClock, CircleDollarSign, Cpu } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReportListItem } from "@/lib/reports";

import { PipelineProgressCompact } from "./pipeline-progress";
import { ReportStatus } from "./report-status";

export interface ReportCardProps {
  report: ReportListItem;
  onApprove: () => void;
}

export function ReportCard({ report, onApprove }: ReportCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {report.date ? `Daily report — ${report.date}` : "Daily report"}
          </h3>
          <p className="text-xs text-muted-foreground">
            Created {new Date(report.created_at).toLocaleString()}
          </p>
        </div>
        <ReportStatus status={report.status} className="shrink-0" />
      </div>

      <PipelineProgressCompact status={report.status} />

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Cpu className="h-3 w-3" aria-hidden />
          {report.model ?? "—"}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-3 w-3" aria-hidden />
          {report.date ?? "—"}
        </span>
        <span className="inline-flex items-center gap-1">
          <CircleDollarSign className="h-3 w-3" aria-hidden />
          {report.cost_cents != null ? `${(report.cost_cents / 100).toFixed(2)}` : "—"}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        {report.status === "script_ready" ? (
          <Button size="sm" onClick={onApprove}>
            Approve
          </Button>
        ) : null}
        <Button asChild variant="outline" size="sm">
          <Link href={`/reports/${report.id}`}>Review</Link>
        </Button>
      </div>
    </article>
  );
}
