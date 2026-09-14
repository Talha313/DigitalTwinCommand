"use client";

import {
  FileStack,
  MessageSquareText,
  MessagesSquare,
  PhoneCall,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SOURCE_LABEL, type MemorySourceType, type MemoryStatus } from "@/lib/memory";

export type MemoryStatusFilter = "all" | MemoryStatus;

const STATUS_OPTIONS: { id: MemoryStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const SOURCE_ICON: Record<MemorySourceType, LucideIcon> = {
  chat: MessagesSquare,
  call: PhoneCall,
  whisper: MessageSquareText,
  document: FileStack,
};

const SOURCE_IDS: MemorySourceType[] = ["chat", "call", "whisper", "document"];

export interface MemoryFiltersProps {
  query: string;
  status: MemoryStatusFilter;
  sources: MemorySourceType[];
  statusCounts: Record<MemoryStatusFilter, number>;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: MemoryStatusFilter) => void;
  onSourcesChange: (value: MemorySourceType[]) => void;
}

export function MemoryFilters({
  query,
  status,
  sources,
  statusCounts,
  onQueryChange,
  onStatusChange,
  onSourcesChange,
}: MemoryFiltersProps) {
  const toggleSource = (id: MemorySourceType) =>
    onSourcesChange(
      sources.includes(id)
        ? sources.filter((entry) => entry !== id)
        : [...sources, id],
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search memories, tags, or content"
            aria-label="Search memories"
            className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-8 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring/60"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>

        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Filter by review status"
        >
          {STATUS_OPTIONS.map((option) => {
            const active = status === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusChange(option.id)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
                <span className="ml-1 text-[11px] opacity-70">
                  {statusCounts[option.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label="Filter by knowledge source"
      >
        {SOURCE_IDS.map((id) => {
          const Icon = SOURCE_ICON[id];
          const active = sources.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => toggleSource(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3 w-3" aria-hidden />
              {SOURCE_LABEL[id]}
            </button>
          );
        })}
        {sources.length > 0 ? (
          <button
            type="button"
            onClick={() => onSourcesChange([])}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
