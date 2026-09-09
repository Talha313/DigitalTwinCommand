"use client";

import * as React from "react";

import { PageContainer } from "@/components/layout/page-container";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  knowledgeSources,
  memories as baseMemories,
  trainingStats,
  type KnowledgeSourceId,
  type MemoryApprovalStatus,
  type MemoryRecord,
} from "@/lib/mock-data/memory";

import { ApprovalPanel } from "./approval-panel";
import { KnowledgeSource } from "./knowledge-source";
import {
  MemoryFilters,
  type MemoryStatusFilter,
} from "./memory-filters";
import { MemoryList } from "./memory-list";
import { TrainingStats } from "./training-stats";

function matchesQuery(memory: MemoryRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (memory.title.toLowerCase().includes(q)) return true;
  if (memory.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
  return memory.excerpts.some((excerpt) =>
    excerpt.text.toLowerCase().includes(q),
  );
}

export function MemoryDashboard() {
  const [list, setList] = React.useState<MemoryRecord[]>(baseMemories);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<MemoryStatusFilter>("all");
  const [sources, setSources] = React.useState<KnowledgeSourceId[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [queueIndex, setQueueIndex] = React.useState(0);

  const pending = list.filter((memory) => memory.status === "pending");
  const approvedCount = list.filter((m) => m.status === "approved").length;
  const rejectedCount = list.filter((m) => m.status === "rejected").length;

  const statusCounts: Record<MemoryStatusFilter, number> = {
    all: list.length,
    pending: pending.length,
    approved: approvedCount,
    rejected: rejectedCount,
  };

  const visible = list.filter((memory) => {
    if (!matchesQuery(memory, query)) return false;
    if (status !== "all" && memory.status !== status) return false;
    if (sources.length > 0 && !sources.includes(memory.source)) return false;
    return true;
  });

  const clampedQueueIndex = pending.length
    ? Math.min(queueIndex, pending.length - 1)
    : 0;
  const currentReview = pending[clampedQueueIndex] ?? null;
  const selected = list.find((memory) => memory.id === selectedId) ?? null;

  const decide = (
    id: string,
    nextStatus: MemoryApprovalStatus,
    note?: string,
  ) => {
    setList((current) =>
      current.map((memory) =>
        memory.id === id ? { ...memory, status: nextStatus, note } : memory,
      ),
    );
  };

  const approve = (id: string, note?: string) => decide(id, "approved", note);
  const reject = (id: string, note?: string) => decide(id, "rejected", note);

  return (
    <PageContainer>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          AI Memory &amp; Training Center
        </h2>
        <p className="text-sm text-muted-foreground">
          Every useful interaction is captured for a future Gold Dataset. Fine-
          tuning is not part of V1 — this is a review surface for the data being
          collected.
        </p>
      </div>

      <TrainingStats stats={trainingStats} />

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          Knowledge sources
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {knowledgeSources.map((source) => (
            <KnowledgeSource key={source.id} source={source} />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">Review queue</p>
          <p className="text-xs text-muted-foreground">
            {pending.length} pending · {approvedCount} approved ·{" "}
            {rejectedCount} rejected
          </p>
        </div>
        <ApprovalPanel
          memory={currentReview}
          onApprove={approve}
          onReject={reject}
          emptyLabel="Nothing left to review in this sample. New records queue automatically as they are collected."
          queue={
            pending.length > 0
              ? {
                  position: clampedQueueIndex + 1,
                  total: pending.length,
                  onNext: () =>
                    setQueueIndex((index) =>
                      Math.min(index + 1, pending.length - 1),
                    ),
                  onPrev: () =>
                    setQueueIndex((index) => Math.max(index - 1, 0)),
                }
              : undefined
          }
        />
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground">All memories</p>
        <MemoryFilters
          query={query}
          status={status}
          sources={sources}
          statusCounts={statusCounts}
          onQueryChange={setQuery}
          onStatusChange={setStatus}
          onSourcesChange={setSources}
        />
        <p className="text-xs text-muted-foreground">
          {visible.length} of {list.length} records
        </p>
        <MemoryList
          memories={visible}
          onReview={setSelectedId}
          onApprove={approve}
          onReject={reject}
        />
      </div>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full max-w-none gap-0 p-0 sm:max-w-lg"
          aria-describedby={undefined}
        >
          {selected ? (
            <>
              <SheetHeader className="border-b border-border/60 px-5 py-4">
                <SheetTitle>Memory record</SheetTitle>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <ApprovalPanel
                  memory={selected}
                  onApprove={(id, note) => {
                    approve(id, note);
                  }}
                  onReject={(id, note) => {
                    reject(id, note);
                  }}
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
