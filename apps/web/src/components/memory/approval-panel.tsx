"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MEMORY_KIND_LABEL,
  SOURCE_LABEL,
  type MemoryRecord,
} from "@/lib/mock-data/memory";

import { DataQualityBadge } from "./data-quality-badge";

export interface ApprovalPanelProps {
  memory: MemoryRecord | null;
  onApprove: (id: string, note?: string) => void;
  onReject: (id: string, note?: string) => void;
  queue?: {
    position: number;
    total: number;
    onNext: () => void;
    onPrev: () => void;
  };
  emptyLabel?: string;
}

export function ApprovalPanel({
  memory,
  onApprove,
  onReject,
  queue,
  emptyLabel = "No memories are awaiting review.",
}: ApprovalPanelProps) {
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    setNote(memory?.note ?? "");
  }, [memory?.id, memory?.note]);

  if (!memory) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  const decided = memory.status !== "pending";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Review record</p>
        {queue ? (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={queue.onPrev}
              aria-label="Previous pending record"
              className="rounded p-0.5 hover:text-foreground disabled:opacity-40"
              disabled={queue.position <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            </button>
            {queue.position} of {queue.total} pending
            <button
              type="button"
              onClick={queue.onNext}
              aria-label="Next pending record"
              className="rounded p-0.5 hover:text-foreground disabled:opacity-40"
              disabled={queue.position >= queue.total}
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-sm font-medium text-foreground">{memory.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{SOURCE_LABEL[memory.source]}</span>
          <span aria-hidden>·</span>
          <span>{MEMORY_KIND_LABEL[memory.kind]}</span>
          <span aria-hidden>·</span>
          <span>{memory.createdLabel}</span>
        </p>
        <div className="mt-2">
          <DataQualityBadge quality={memory.quality} />
        </div>
      </div>

      <div className="space-y-2">
        {memory.excerpts.map((excerpt, index) => (
          <div
            key={index}
            className="rounded-lg border border-border/50 bg-background/40 p-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {excerpt.label}
            </p>
            <p className="mt-1 text-sm text-foreground">{excerpt.text}</p>
          </div>
        ))}
      </div>

      {memory.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-border/60 bg-background/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div>
        <label
          htmlFor={`note-${memory.id}`}
          className="text-xs font-medium text-foreground"
        >
          Reviewer note
        </label>
        <textarea
          id={`note-${memory.id}`}
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional — why this is (or isn't) a good training example."
          className="mt-1 w-full resize-none rounded-lg border border-border/60 bg-background/40 p-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring/60"
        />
      </div>

      {decided ? (
        <p
          className={cn(
            "text-xs font-medium",
            memory.status === "approved" ? "text-emerald-300" : "text-rose-300",
          )}
        >
          {memory.status === "approved" ? "Approved" : "Rejected"} · added to the
          review log
        </p>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 text-rose-300 hover:text-rose-200"
            onClick={() => onReject(memory.id, note.trim() || undefined)}
          >
            <X className="h-4 w-4" aria-hidden />
            Reject
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={() => onApprove(memory.id, note.trim() || undefined)}
          >
            <Check className="h-4 w-4" aria-hidden />
            Approve for training
          </Button>
        </div>
      )}
    </div>
  );
}
