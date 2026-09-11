"use client";

import * as React from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getTranscript, toUiDirection, type CallRead } from "@/lib/calls";
import { callTimestamp, formatCallTimestamp, mapCallTranscript } from "@/lib/call-history";
import type { TranscriptUtterance } from "@/lib/mock-data/types";

import { CallMetadata } from "./call-metadata";
import { OutcomeBadge } from "./outcome-badge";
import { TranscriptViewer } from "./transcript-viewer";

type Tab = "overview" | "transcript";

export interface CallDetailsDrawerProps {
  call: CallRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallDetailsDrawer({
  call,
  open,
  onOpenChange,
}: CallDetailsDrawerProps) {
  const [tab, setTab] = React.useState<Tab>("overview");
  const [transcript, setTranscript] = React.useState<TranscriptUtterance[] | null>(null);
  const [transcriptError, setTranscriptError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) setTab("overview");
  }, [open, call?.id]);

  React.useEffect(() => {
    if (!call) {
      setTranscript(null);
      setTranscriptError(null);
      return;
    }
    let cancelled = false;
    setTranscript(null);
    setTranscriptError(null);
    getTranscript(call.id)
      .then((rows) => {
        if (cancelled) return;
        setTranscript(mapCallTranscript(call, rows));
      })
      .catch((err) => {
        if (cancelled) return;
        setTranscriptError(
          err instanceof Error ? err.message : "Failed to load transcript.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [call]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    {
      id: "transcript",
      label: `Transcript${transcript ? ` (${transcript.length})` : ""}`,
    },
  ];

  const direction = call ? toUiDirection(call.direction) : "inbound";
  const DirectionIcon = direction === "inbound" ? ArrowDownLeft : ArrowUpRight;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-none gap-0 p-0 sm:max-w-xl"
        aria-describedby={undefined}
      >
        {call ? (
          <>
            <SheetHeader className="border-b border-border/60 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0">
                  <SheetTitle className="font-mono">
                    {direction === "inbound"
                      ? call.from_e164 ?? "Unknown"
                      : call.to_e164 ?? "Unknown"}
                  </SheetTitle>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DirectionIcon className="h-3 w-3" aria-hidden />
                    {direction === "inbound" ? "Inbound" : "Outbound"} ·{" "}
                    {formatCallTimestamp(callTimestamp(call))}
                  </p>
                </div>
                <OutcomeBadge outcome={call.outcome} className="ml-auto shrink-0" />
              </div>

              <div
                role="tablist"
                aria-label="Call detail sections"
                className="mt-3 flex gap-1"
              >
                {tabs.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === entry.id}
                    onClick={() => setTab(entry.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      tab === entry.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {tab === "overview" ? <CallMetadata call={call} /> : null}
              {tab === "transcript" ? (
                transcriptError ? (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-center text-sm text-destructive">
                    {transcriptError}
                  </p>
                ) : transcript === null ? (
                  <p className="rounded-lg border border-dashed border-border/60 bg-background/40 p-4 text-center text-sm text-muted-foreground">
                    Loading transcript…
                  </p>
                ) : (
                  <TranscriptViewer utterances={transcript} />
                )
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
