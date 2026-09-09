import {
  BadgeCheck,
  Check,
  Clapperboard,
  CloudUpload,
  FileText,
  Film,
  Loader2,
  Search,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  PIPELINE_STAGES,
  pipelineStageStates,
  type PipelineStageId,
  type ReportEntry,
} from "@/lib/mock-data/reports";

const STAGE_ICON: Record<PipelineStageId, LucideIcon> = {
  research: Search,
  script: FileText,
  approval: BadgeCheck,
  voice: Waves,
  avatar: Clapperboard,
  processing: Film,
  storage: CloudUpload,
};

export interface PipelineProgressProps {
  report: Pick<ReportEntry, "status" | "failedStage" | "failureReason">;
  variant?: "full" | "compact";
  className?: string;
}

export function PipelineProgress({
  report,
  variant = "full",
  className,
}: PipelineProgressProps) {
  const states = pipelineStageStates(report);
  const doneCount = PIPELINE_STAGES.filter(
    (stage) => states[stage.id] === "done",
  ).length;
  const activeStage = PIPELINE_STAGES.find(
    (stage) => states[stage.id] === "active",
  );
  const failedStage = PIPELINE_STAGES.find(
    (stage) => states[stage.id] === "failed",
  );

  if (variant === "compact") {
    const total = PIPELINE_STAGES.length;
    const current = failedStage ?? activeStage;
    const currentIndex = current
      ? PIPELINE_STAGES.findIndex((stage) => stage.id === current.id) + 1
      : report.status === "READY"
        ? total
        : 0;
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              failedStage ? "bg-rose-400" : "bg-primary",
            )}
            style={{ width: `${(doneCount / total) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {report.status === "READY"
            ? "All 7 stages complete"
            : failedStage
              ? `Failed at step ${currentIndex} of ${total} · ${failedStage.label}`
              : current
                ? `Step ${currentIndex} of ${total} · ${current.label}`
                : "Queued"}
        </p>
      </div>
    );
  }

  return (
    <ol
      className={cn(
        "relative space-y-4 before:absolute before:left-[15px] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-border",
        className,
      )}
    >
      {PIPELINE_STAGES.map((stage) => {
        const state = states[stage.id] ?? "pending";
        const Icon = STAGE_ICON[stage.id];
        return (
          <li key={stage.id} className="relative flex gap-3">
            <span
              className={cn(
                "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-card",
                state === "done" && "border-emerald-500/40 text-emerald-300",
                state === "active" && "border-primary/50 text-primary",
                state === "failed" && "border-rose-500/40 text-rose-300",
                state === "pending" && "border-border/60 text-muted-foreground",
              )}
            >
              {state === "done" ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : state === "failed" ? (
                <X className="h-4 w-4" aria-hidden />
              ) : state === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Icon className="h-4 w-4" aria-hidden />
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  state === "pending"
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {stage.label}
                {state === "active" ? (
                  <span className="ml-2 text-[11px] font-normal text-primary">
                    In progress
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {stage.description}
              </p>
              {state === "failed" && report.failureReason ? (
                <p className="mt-1 text-xs font-medium text-rose-300">
                  {report.failureReason}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
