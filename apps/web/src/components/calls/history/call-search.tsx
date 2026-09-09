"use client";

import { Search, X } from "lucide-react";

export interface CallSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function CallSearch({ value, onChange }: CallSearchProps) {
  return (
    <div className="relative flex-1 sm:max-w-xs">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search caller, number, or transcript"
        aria-label="Search calls"
        className="h-9 w-full rounded-lg border border-border/60 bg-card pl-9 pr-8 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring/60"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
