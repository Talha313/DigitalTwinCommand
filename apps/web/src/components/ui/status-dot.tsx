import * as React from "react";

import { cn } from "@/lib/utils";

export type StatusTone = "positive" | "neutral" | "warning" | "critical";

const TONE_CLASS: Record<StatusTone, string> = {
  positive: "bg-emerald-400",
  neutral: "bg-slate-400",
  warning: "bg-amber-400",
  critical: "bg-rose-400",
};

export interface StatusDotProps {
  tone?: StatusTone;
  pulse?: boolean;
  label?: string;
  className?: string;
}

export function StatusDot({
  tone = "neutral",
  pulse = false,
  label,
  className,
}: StatusDotProps) {
  return (
    <span
      className={cn("relative inline-flex h-2 w-2 shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {pulse ? (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
            TONE_CLASS[tone],
          )}
        />
      ) : null}
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          TONE_CLASS[tone],
        )}
      />
    </span>
  );
}
