"use client";

import type { MemoryRecord } from "@/lib/mock-data/memory";

import { MemoryCard } from "./memory-card";

export interface MemoryListProps {
  memories: MemoryRecord[];
  onReview: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function MemoryList({
  memories,
  onReview,
  onApprove,
  onReject,
}: MemoryListProps) {
  if (memories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No memories match your search and filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {memories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          onReview={() => onReview(memory.id)}
          onApprove={() => onApprove(memory.id)}
          onReject={() => onReject(memory.id)}
        />
      ))}
    </div>
  );
}
