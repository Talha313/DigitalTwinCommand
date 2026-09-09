"use client";

import { CalendarClock, CircleDollarSign, Cpu } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReportEntry } from "@/lib/mock-data/reports";

import { PipelineProgress } from "./pipeline-progress";
import { ReportStatus } from "./report-status";

export interface ReportCardProps {
  report: ReportEntry;
  onReview: () => void;
  onApprove: () => void;
}

export function ReportCard({ report, onReview, onApprove }: ReportCardProps) {
  const durationLabel =
    report.status === "READY" && report.actualMinutes
      ? `${report.actualMinutes} min`
      : `~${report.targetMinutes} min target`;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {report.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {report.dateLabel} · {report.createdAtLabel}
          </p>
        </div>
        <ReportStatus status={report.status} className="shrink-0" />
      </div>

      <PipelineProgress report={report} variant="compact" />

      {report.status === "FAILED" && report.failureReason ? (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1.5 text-xs text-rose-300">
          {report.failureReason}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Cpu className="h-3 w-3" aria-hidden />
          {report.model}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-3 w-3" aria-hidden />
          {durationLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <CircleDollarSign className="h-3 w-3" aria-hidden />
          {report.estimatedCost}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        {report.status === "AWAITING_APPROVAL" ? (
          <Button size="sm" onClick={onApprove}>
            Approve
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={onReview}>
          Review
        </Button>
      </div>
    </article>
  );
}
