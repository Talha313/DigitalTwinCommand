"use client";

import { cn } from "@/lib/utils";
import { TONE_OPTIONS, type ToneId } from "@/lib/mock-data/role-config";

export interface ToneSelectorProps {
  value: ToneId;
  onChange: (tone: ToneId) => void;
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">Communication tone</p>
      <p className="text-xs text-muted-foreground">
        How the Twin sounds on this role.
      </p>
      <div
        role="group"
        aria-label="Communication tone"
        className="mt-3 grid gap-2 sm:grid-cols-2"
      >
        {TONE_OPTIONS.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/60 bg-background/40 hover:border-border",
              )}
            >
              <span
                className={cn(
                  "block text-sm font-medium",
                  active ? "text-primary" : "text-foreground",
                )}
              >
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
