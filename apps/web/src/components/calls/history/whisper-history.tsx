"use client";

import * as React from "react";

import { Switch } from "@/components/ui/switch";
import type { CallHistoryWhisper } from "@/lib/mock-data/types";

export interface WhisperHistoryProps {
  whispers: CallHistoryWhisper[];
}

export function WhisperHistory({ whispers }: WhisperHistoryProps) {
  const [training, setTraining] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(whispers.map((w) => [w.id, w.usedInTraining])),
  );

  React.useEffect(() => {
    setTraining(Object.fromEntries(whispers.map((w) => [w.id, w.usedInTraining])));
  }, [whispers]);

  if (whispers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 bg-background/40 p-4 text-center text-sm text-muted-foreground">
        No operator whispers on this call.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Whispers are retained as training data. Toggle whether each one is
        included in the gold dataset (UI preview — not saved).
      </p>

      <ul className="space-y-2">
        {whispers.map((whisper) => {
          const included = training[whisper.id] ?? false;
          return (
            <li
              key={whisper.id}
              className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3"
            >
              <p className="text-sm text-foreground">{whisper.text}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Queued {whisper.queuedAt}
                  {whisper.spokenAt
                    ? ` · Spoken ${whisper.spokenAt}`
                    : " · Not spoken"}
                </span>
                <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span id={`${whisper.id}-training`}>In training set</span>
                  <Switch
                    checked={included}
                    onCheckedChange={(value) =>
                      setTraining((prev) => ({ ...prev, [whisper.id]: value }))
                    }
                    aria-labelledby={`${whisper.id}-training`}
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
