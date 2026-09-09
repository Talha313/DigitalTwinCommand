"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TranscriptMessage } from "@/components/calls/transcript-message";
import type {
  TranscriptUtterance,
  UtteranceSpeaker,
} from "@/lib/mock-data/types";

type SpeakerFilter = "all" | UtteranceSpeaker;

const FILTERS: { id: SpeakerFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "caller", label: "Caller" },
  { id: "twin", label: "Twin" },
  { id: "whisper", label: "Whisper" },
];

export interface TranscriptViewerProps {
  utterances: TranscriptUtterance[];
}

export function TranscriptViewer({ utterances }: TranscriptViewerProps) {
  const [filter, setFilter] = React.useState<SpeakerFilter>("all");
  const [copied, setCopied] = React.useState(false);

  const visible =
    filter === "all"
      ? utterances
      : utterances.filter((u) => u.speaker === filter);

  const copy = async () => {
    const text = utterances
      .map((u) => `[${u.timestamp}] ${u.speaker.toUpperCase()}: ${u.text}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context) — non-fatal.
    }
  };

  if (utterances.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 bg-background/40 p-4 text-center text-sm text-muted-foreground">
        No transcript was captured for this call.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter transcript by speaker">
          {FILTERS.map((option) => {
            const count =
              option.id === "all"
                ? utterances.length
                : utterances.filter((u) => u.speaker === option.id).length;
            const active = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option.id)}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
                <span className="ml-1 text-[11px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={copy}
          className="gap-1.5 text-xs"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy transcript"}
        </Button>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-background/40 p-4 text-center text-sm text-muted-foreground">
          No {filter} lines in this transcript.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((utterance) => (
            <TranscriptMessage key={utterance.id} utterance={utterance} />
          ))}
        </div>
      )}
    </div>
  );
}
