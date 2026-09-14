"use client";

import { cn } from "@/lib/utils";
import type { ReportStatus } from "@/lib/reports";

export type ReportFilterBucket =
  | "all"
  | "ready"
  | "in_progress"
  | "awaiting_approval"
  | "failed";

/** Non-terminal statuses that aren't specifically "waiting on an operator to
 * approve the script" — everything the pipeline is actively working through
 * on its own. */
const IN_PROGRESS: ReportStatus[] = [
  "queued",
  "researching",
  "approved",
  "generating",
  "awaiting_avatar",
];

export function matchesBucket(
  status: ReportStatus,
  bucket: ReportFilterBucket,
): boolean {
  switch (bucket) {
    case "all":
      return true;
    case "ready":
      return status === "ready";
    case "awaiting_approval":
      return status === "script_ready";
    case "failed":
      return status === "failed";
    case "in_progress":
      return IN_PROGRESS.includes(status);
    default:
      return true;
  }
}

const OPTIONS: { id: ReportFilterBucket; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "in_progress", label: "In progress" },
  { id: "awaiting_approval", label: "Awaiting approval" },
  { id: "failed", label: "Failed" },
];

export interface ReportFiltersProps {
  value: ReportFilterBucket;
  onChange: (value: ReportFilterBucket) => void;
  counts: Record<ReportFilterBucket, number>;
}

export function ReportFilters({ value, onChange, counts }: ReportFiltersProps) {
  return (
    <div
      className="flex flex-wrap gap-1"
      role="group"
      aria-label="Filter reports by status"
    >
      {OPTIONS.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            <span className="ml-1 text-[11px] opacity-70">
              {counts[option.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
