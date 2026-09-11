"use client";

import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SOURCE_LABEL, qualityFromConfidence, type MemoryRead } from "@/lib/memory";

import { DataQualityBadge } from "./data-quality-badge";

export interface ApprovalPanelProps {
  memory: MemoryRead | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
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
        <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{SOURCE_LABEL[memory.source_type]}</span>
          <span aria-hidden>·</span>
          <span>{new Date(memory.created_at).toLocaleString()}</span>
        </p>
        <div className="mt-2">
          <DataQualityBadge quality={qualityFromConfidence(memory.confidence)} />
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-background/40 p-3">
        <p className="text-sm text-foreground">{memory.content}</p>
      </div>

      {decided ? (
        <p
          className={cn(
            "text-xs font-medium",
            memory.status === "approved" ? "text-emerald-300" : "text-rose-300",
          )}
        >
          {memory.status === "approved" ? "Approved" : "Rejected"}
        </p>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 text-rose-300 hover:text-rose-200"
            onClick={() => onReject(memory.id)}
          >
            <X className="h-4 w-4" aria-hidden />
            Reject
          </Button>
          <Button className="flex-1 gap-2" onClick={() => onApprove(memory.id)}>
            <Check className="h-4 w-4" aria-hidden />
            Approve for training
          </Button>
        </div>
      )}
    </div>
  );
}
