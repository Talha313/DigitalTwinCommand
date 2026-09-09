"use client";

import * as React from "react";
import { Clock, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ReportScript } from "@/lib/mock-data/reports";

type Tab = "brief" | "script";

export interface ScriptPreviewProps {
  script?: ReportScript;
}

export function ScriptPreview({ script }: ScriptPreviewProps) {
  const [tab, setTab] = React.useState<Tab>("script");

  if (!script) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 bg-background/40 p-4 text-center text-sm text-muted-foreground">
        The script has not been generated yet.
      </p>
    );
  }

  const body = tab === "brief" ? script.brief : script.script;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1" role="group" aria-label="Script view">
          {(
            [
              { id: "brief", label: "Research brief" },
              { id: "script", label: "Final script" },
            ] as { id: Tab; label: string }[]
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={tab === option.id}
              onClick={() => setTab(option.id)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                tab === option.id
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3 w-3" aria-hidden />
            {script.wordCount} words
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden />~{script.estimatedMinutes} min
          </span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border border-border/50 bg-background/40 p-4">
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
          {body}
        </p>
      </div>
    </div>
  );
}
