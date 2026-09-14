"use client";

import {
  FileStack,
  MessageSquareText,
  MessagesSquare,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  SOURCE_LABEL,
  qualityFromConfidence,
  type MemoryRead,
  type MemoryStatus,
  type MemorySourceType,
} from "@/lib/memory";

import { DataQualityBadge } from "./data-quality-badge";

const SOURCE_ICON: Record<MemorySourceType, LucideIcon> = {
  chat: MessagesSquare,
  call: PhoneCall,
  whisper: MessageSquareText,
  document: FileStack,
};

const STATUS_META: Record<MemoryStatus, { label: string; className: string }> = {
  pending: { label: "Pending review", className: "text-amber-300" },
  approved: { label: "Approved", className: "text-emerald-300" },
  rejected: { label: "Rejected", className: "text-rose-300" },
};

export interface MemoryCardProps {
  memory: MemoryRead;
  onReview: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function MemoryCard({ memory, onReview, onApprove, onReject }: MemoryCardProps) {
  const Icon = SOURCE_ICON[memory.source_type];
  const status = STATUS_META[memory.status];

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Icon className="h-3 w-3" aria-hidden />
          {SOURCE_LABEL[memory.source_type]}
        </p>
        <DataQualityBadge
          quality={qualityFromConfidence(memory.confidence)}
          showLabel={false}
          className="shrink-0"
        />
      </div>

      <p className="line-clamp-3 text-sm text-foreground">{memory.content}</p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className={cn("text-[11px] font-medium", status.className)}>
          {status.label} · {new Date(memory.created_at).toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          {memory.status === "pending" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-300 hover:text-rose-200"
                onClick={onReject}
              >
                Reject
              </Button>
              <Button size="sm" onClick={onApprove}>
                Approve
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onReview}>
              Review
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
