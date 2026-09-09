"use client";

import { cn } from "@/lib/utils";
import { RiskBadge } from "@/components/roles/risk-badge";
import type { RiskLevel } from "@/lib/mock-data/types";

const OPTIONS: {
  id: RiskLevel;
  headline: string;
  detail: string;
}[] = [
  {
    id: "low",
    headline: "Read-only and summaries",
    detail: "Market data, portfolio reads, and content summaries. No approval needed.",
  },
  {
    id: "medium",
    headline: "Reversible actions",
    detail: "Messaging, task creation, and workflow runs. Logged for review.",
  },
  {
    id: "high",
    headline: "Financial or public actions",
    detail: "Every high-risk tool call requires explicit operator approval.",
  },
];

export interface RiskSelectorProps {
  value: RiskLevel;
  onChange: (level: RiskLevel) => void;
}

export function RiskSelector({ value, onChange }: RiskSelectorProps) {
  const selected = OPTIONS.find((option) => option.id === value);

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">Risk level</h3>
        <p className="text-xs text-muted-foreground">
          Sets the approval threshold for this role.
        </p>
      </div>

      <div className="space-y-2 p-5">
        <div
          role="group"
          aria-label="Risk level"
          className="grid gap-2 sm:grid-cols-3"
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
                  "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/60 bg-background/40 hover:border-border",
                )}
              >
                <RiskBadge level={option.id} />
                <span className="text-xs text-muted-foreground">
                  {option.headline}
                </span>
              </button>
            );
          })}
        </div>

        {selected ? (
          <p className="rounded-lg border border-border/50 bg-background/40 p-3 text-xs text-muted-foreground">
            {selected.detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}
