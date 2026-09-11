import {
  BadgeCheck,
  Check,
  Clapperboard,
  CloudUpload,
  FileText,
  Loader2,
  Search,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ReportJobRead, ReportStage, ReportStatus } from "@/lib/reports";

const STAGE_ICON: Record<ReportStage, LucideIcon> = {
  research: Search,
  script: FileText,
  voice: Waves,
  avatar: Clapperboard,
  processing: BadgeCheck,
  upload: CloudUpload,
};

const STAGE_LABEL: Record<ReportStage, string> = {
  research: "Research",
  script: "Script",
  voice: "Voice",
  avatar: "Avatar",
  processing: "Processing",
  upload: "Upload",
};

/** Ordered position of each status in the real lifecycle, for the compact
 * progress bar — there's no per-stage percentage from the backend, only a
 * discrete status, so this is "how far along the 8-step lifecycle are we." */
const STATUS_ORDER: ReportStatus[] = [
  "queued",
  "researching",
  "script_ready",
  "approved",
  "generating",
  "awaiting_avatar",
  "ready",
];

const STATUS_LABEL: Record<ReportStatus, string> = {
  queued: "Queued",
  researching: "Researching",
  script_ready: "Script ready — awaiting approval",
  approved: "Approved",
  generating: "Generating",
  awaiting_avatar: "Awaiting avatar",
  ready: "Ready",
  failed: "Failed",
};

export interface PipelineProgressCompactProps {
  status: ReportStatus;
  className?: string;
}

/** List-card summary — derived from the report's status alone, no per-job
 * fetch (avoids an N+1 request per card in the list view). */
export function PipelineProgressCompact({
  status,
  className,
}: PipelineProgressCompactProps) {
  const total = STATUS_ORDER.length;
  const index = status === "failed" ? -1 : STATUS_ORDER.indexOf(status);
  const doneCount = status === "ready" ? total : Math.max(index, 0);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            status === "failed" ? "bg-rose-400" : "bg-primary",
          )}
          style={{ width: `${(doneCount / total) * 100}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {status === "failed"
          ? "Failed"
          : `${STATUS_LABEL[status]} · step ${Math.max(doneCount, 1)} of ${total}`}
      </p>
    </div>
  );
}

export interface PipelineProgressProps {
  jobs: ReportJobRead[];
  className?: string;
}

/** Detail-page view — real per-job stage tracking from GET /reports/{id}/jobs. */
export function PipelineProgress({ jobs, className }: PipelineProgressProps) {
  if (jobs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 bg-background/40 p-4 text-center text-sm text-muted-foreground">
        No pipeline jobs yet — they&apos;re created once generation starts.
      </p>
    );
  }

  return (
    <ol
      className={cn(
        "relative space-y-4 before:absolute before:left-[15px] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-border",
        className,
      )}
    >
      {jobs.map((job) => {
        const Icon = STAGE_ICON[job.stage];
        const state = job.status;
        return (
          <li key={job.id} className="relative flex gap-3">
            <span
              className={cn(
                "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-card",
                state === "completed" && "border-emerald-500/40 text-emerald-300",
                state === "running" && "border-primary/50 text-primary",
                state === "failed" && "border-rose-500/40 text-rose-300",
                state === "pending" && "border-border/60 text-muted-foreground",
              )}
            >
              {state === "completed" ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : state === "failed" ? (
                <X className="h-4 w-4" aria-hidden />
              ) : state === "running" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Icon className="h-4 w-4" aria-hidden />
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  state === "pending" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {STAGE_LABEL[job.stage]}
                {state === "running" ? (
                  <span className="ml-2 text-[11px] font-normal text-primary">
                    In progress
                  </span>
                ) : null}
              </p>
              {job.error_message ? (
                <p className="mt-1 text-xs font-medium text-rose-300">
                  {job.error_message}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
