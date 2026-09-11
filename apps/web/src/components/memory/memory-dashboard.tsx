"use client";

import * as React from "react";

import { PageContainer } from "@/components/layout/page-container";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApiError } from "@/lib/api-client";
import {
  listMemories,
  updateMemoryStatus,
  type MemoryRead,
  type MemorySourceType,
  type MemoryStatus,
} from "@/lib/memory";

import { ApprovalPanel } from "./approval-panel";
import { KnowledgeSource } from "./knowledge-source";
import { MemoryFilters, type MemoryStatusFilter } from "./memory-filters";
import { MemoryList } from "./memory-list";
import { TrainingStats } from "./training-stats";

const SOURCE_IDS: MemorySourceType[] = ["chat", "call", "whisper", "document"];

function matchesQuery(memory: MemoryRead, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return memory.content.toLowerCase().includes(q);
}

export function MemoryDashboard() {
  const [list, setList] = React.useState<MemoryRead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<MemoryStatusFilter>("all");
  const [sources, setSources] = React.useState<MemorySourceType[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [queueIndex, setQueueIndex] = React.useState(0);

  const refresh = React.useCallback(async () => {
    try {
      const data = await listMemories();
      setList(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load memories.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const pending = list.filter((memory) => memory.status === "pending");
  const approvedCount = list.filter((m) => m.status === "approved").length;
  const rejectedCount = list.filter((m) => m.status === "rejected").length;

  const statusCounts: Record<MemoryStatusFilter, number> = {
    all: list.length,
    pending: pending.length,
    approved: approvedCount,
    rejected: rejectedCount,
  };

  const bySource = SOURCE_IDS.map((source) => ({
    source,
    count: list.filter((m) => m.source_type === source).length,
  }));

  const visible = list.filter((memory) => {
    if (!matchesQuery(memory, query)) return false;
    if (status !== "all" && memory.status !== status) return false;
    if (sources.length > 0 && !sources.includes(memory.source_type)) return false;
    return true;
  });

  const clampedQueueIndex = pending.length ? Math.min(queueIndex, pending.length - 1) : 0;
  const currentReview = pending[clampedQueueIndex] ?? null;
  const selected = list.find((memory) => memory.id === selectedId) ?? null;

  const decide = async (id: string, nextStatus: MemoryStatus) => {
    try {
      const updated = await updateMemoryStatus(id, nextStatus);
      setList((current) => current.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update this memory.");
    }
  };

  const approve = (id: string) => decide(id, "approved");
  const reject = (id: string) => decide(id, "rejected");

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

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading memories…</p>
      ) : (
        <>
          <TrainingStats
            total={list.length}
            pending={pending.length}
            approved={approvedCount}
            bySource={bySource}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Knowledge sources
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {bySource.map(({ source, count }) => (
                <KnowledgeSource key={source} source={source} count={count} />
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
              emptyLabel="Nothing left to review. New records queue automatically as calls and chats are collected."
              queue={
                pending.length > 0
                  ? {
                      position: clampedQueueIndex + 1,
                      total: pending.length,
                      onNext: () =>
                        setQueueIndex((index) => Math.min(index + 1, pending.length - 1)),
                      onPrev: () => setQueueIndex((index) => Math.max(index - 1, 0)),
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
        </>
      )}

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
                <ApprovalPanel memory={selected} onApprove={approve} onReject={reject} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
