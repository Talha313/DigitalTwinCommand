"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: PaginationProps) {
  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <div className={cn("flex items-center justify-center pt-3", className)}>
      <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1 shadow-sm">
        <button
          type="button"
          disabled={!canPrev}
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>

        <span className="min-w-[4.5rem] select-none px-2 text-center text-xs font-medium tabular-nums text-foreground">
          <span className="font-semibold text-primary">{page}</span>
          <span className="text-muted-foreground"> / {pageCount}</span>
        </span>

        <button
          type="button"
          disabled={!canNext}
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
