"use client";

import {
  FileBarChart,
  FileStack,
  FileText,
  MessageSquareText,
  MessagesSquare,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MEMORY_KIND_LABEL,
  SOURCE_LABEL,
  type KnowledgeSourceId,
  type MemoryApprovalStatus,
  type MemoryRecord,
} from "@/lib/mock-data/memory";

import { DataQualityBadge } from "./data-quality-badge";

const SOURCE_ICON: Record<KnowledgeSourceId, LucideIcon> = {
  chat: MessagesSquare,
  call: PhoneCall,
  transcript: FileText,
  whisper: MessageSquareText,
  report: FileBarChart,
  document: FileStack,
};

const STATUS_META: Record<
  MemoryApprovalStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending review", className: "text-amber-300" },
  approved: { label: "Approved", className: "text-emerald-300" },
  rejected: { label: "Rejected", className: "text-rose-300" },
};

export interface MemoryCardProps {
  memory: MemoryRecord;
  onReview: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function MemoryCard({
  memory,
  onReview,
  onApprove,
  onReject,
}: MemoryCardProps) {
  const Icon = SOURCE_ICON[memory.source];
  const status = STATUS_META[memory.status];
  const firstExcerpt = memory.excerpts[0];

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {memory.title}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Icon className="h-3 w-3" aria-hidden />
              {SOURCE_LABEL[memory.source]}
            </span>
            <span aria-hidden>·</span>
            <span>{MEMORY_KIND_LABEL[memory.kind]}</span>
          </p>
        </div>
        <DataQualityBadge
          quality={memory.quality}
          showLabel={false}
          className="shrink-0"
        />
      </div>

      {firstExcerpt ? (
        <p className="line-clamp-2 rounded-lg border border-border/50 bg-background/40 p-2.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">
            {firstExcerpt.label}:{" "}
          </span>
          {firstExcerpt.text}
        </p>
      ) : null}

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

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className={cn("text-[11px] font-medium", status.className)}>
          {status.label} · {memory.createdLabel}
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
      {memory.status === "pending" ? (
        <Button
          variant="link"
          size="sm"
          className="h-auto w-fit p-0 text-xs"
          onClick={onReview}
        >
          Open full record
        </Button>
      ) : null}
    </article>
  );
}
