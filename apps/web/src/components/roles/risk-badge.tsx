import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/mock-data/types";

const META: Record<RiskLevel, { label: string; className: string }> = {
  low: {
    label: "Low risk",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  },
  medium: {
    label: "Medium risk",
    className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  },
  high: {
    label: "High risk",
    className: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  },
};

export interface RiskBadgeProps {
  level: RiskLevel;
  /** When false, shows only the level (LOW/MEDIUM/HIGH) — for tight spaces. */
  showLabel?: boolean;
  className?: string;
}

export function RiskBadge({
  level,
  showLabel = true,
  className,
}: RiskBadgeProps) {
  const meta = META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {showLabel ? meta.label : level.toUpperCase()}
    </span>
  );
}
