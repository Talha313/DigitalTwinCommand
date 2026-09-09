import { cn } from "@/lib/utils";
import type { CallOutcome } from "@/lib/mock-data/types";

const OUTCOME_META: Record<CallOutcome, { label: string; className: string }> = {
  resolved: {
    label: "Resolved",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  },
  follow_up_scheduled: {
    label: "Follow-up scheduled",
    className: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  },
  info_provided: {
    label: "Info provided",
    className: "border-primary/25 bg-primary/10 text-primary",
  },
  voicemail: {
    label: "Voicemail",
    className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  },
  no_answer: {
    label: "No answer",
    className: "border-border bg-muted text-muted-foreground",
  },
  dropped: {
    label: "Dropped",
    className: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  },
  escalated: {
    label: "Escalated",
    className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  },
};

export interface OutcomeBadgeProps {
  outcome: CallOutcome;
  className?: string;
}

export function OutcomeBadge({ outcome, className }: OutcomeBadgeProps) {
  const meta = OUTCOME_META[outcome];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
