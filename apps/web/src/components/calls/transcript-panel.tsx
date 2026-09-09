"use client";

import * as React from "react";
import { Radio } from "lucide-react";

import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/status-dot";
import type { CallState, TranscriptUtterance } from "@/lib/mock-data/types";

import { TranscriptMessage } from "./transcript-message";

const LIVE_STATES: CallState[] = [
  "LISTENING",
  "THINKING",
  "SPEAKING",
  "WHISPER_QUEUED",
];

export interface TranscriptPanelProps {
  utterances: TranscriptUtterance[];
  state: CallState;
  className?: string;
}

export function TranscriptPanel({
  utterances,
  state,
  className,
}: TranscriptPanelProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const live = LIVE_STATES.includes(state);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [utterances, state]);

  return (
    <div
      className={cn(
        "flex min-h-[22rem] flex-col rounded-xl border border-border/60 bg-card lg:h-full lg:min-h-0",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" aria-hidden />
          <p className="text-sm font-semibold text-foreground">
            Live transcript
          </p>
        </div>
        {live ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-emerald-300">
            <StatusDot tone="positive" pulse />
            Live
          </span>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {utterances.length === 0 ? (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              The transcript appears here once the call connects.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {utterances.map((utterance) => (
              <TranscriptMessage key={utterance.id} utterance={utterance} />
            ))}
            {state === "THINKING" ? (
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-br-sm border border-primary/20 bg-primary/10 px-3.5 py-2 text-xs text-muted-foreground">
                  Digital Twin is responding&hellip;
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
