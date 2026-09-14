import { cn } from "@/lib/utils";
import type { CallOutcome } from "@/lib/call-history";

const OUTCOME_META: Record<CallOutcome, { label: string; className: string }> = {
  won: {
    label: "Won",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  },
  lost: {
    label: "Lost",
    className: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  },
  follow_up: {
    label: "Follow-up",
    className: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  },
  junk: {
    label: "Junk",
    className: "border-border bg-muted text-muted-foreground",
  },
};

export interface OutcomeBadgeProps {
  /** `CallRead.outcome` — a plain string on the wire, null until an operator sets one. */
  outcome: string | null;
  className?: string;
}

export function OutcomeBadge({ outcome, className }: OutcomeBadgeProps) {
  const meta =
    outcome && Object.hasOwn(OUTCOME_META, outcome)
      ? OUTCOME_META[outcome as CallOutcome]
      : null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        meta?.className ?? "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {meta?.label ?? outcome ?? "No outcome"}
    </span>
  );
}
