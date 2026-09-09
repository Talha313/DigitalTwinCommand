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
import type { CallHistoryEntry } from "@/lib/mock-data/types";

import { CallMetadata } from "./call-metadata";
import { OutcomeBadge } from "./outcome-badge";
import { TranscriptViewer } from "./transcript-viewer";
import { WhisperHistory } from "./whisper-history";

type Tab = "overview" | "transcript" | "whispers";

export interface CallDetailsDrawerProps {
  call: CallHistoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallDetailsDrawer({
  call,
  open,
  onOpenChange,
}: CallDetailsDrawerProps) {
  const [tab, setTab] = React.useState<Tab>("overview");

  React.useEffect(() => {
    if (open) setTab("overview");
  }, [open, call?.id]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    {
      id: "transcript",
      label: `Transcript${call ? ` (${call.transcript.length})` : ""}`,
    },
    {
      id: "whispers",
      label: `Whispers${call ? ` (${call.whispers.length})` : ""}`,
    },
  ];

  const DirectionIcon =
    call?.direction === "inbound" ? ArrowDownLeft : ArrowUpRight;

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
                  <SheetTitle>{call.caller}</SheetTitle>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DirectionIcon className="h-3 w-3" aria-hidden />
                    {call.direction === "inbound" ? "Inbound" : "Outbound"} ·{" "}
                    {call.dateLabel}, {call.startedAtLabel}
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
                <TranscriptViewer utterances={call.transcript} />
              ) : null}
              {tab === "whispers" ? (
                <WhisperHistory whispers={call.whispers} />
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
