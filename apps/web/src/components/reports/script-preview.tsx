"use client";

import * as React from "react";
import { FileText } from "lucide-react";

import { cn } from "@/lib/utils";

type Tab = "brief" | "script";

export interface ScriptPreviewProps {
  script: string | null;
  briefJson: Record<string, unknown> | null;
}

export function ScriptPreview({ script, briefJson }: ScriptPreviewProps) {
  const [tab, setTab] = React.useState<Tab>("script");

  if (!script && !briefJson) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 bg-background/40 p-4 text-center text-sm text-muted-foreground">
        The script has not been generated yet.
      </p>
    );
  }

  const body =
    tab === "brief"
      ? briefJson
        ? JSON.stringify(briefJson, null, 2)
        : "No research brief yet."
      : (script ?? "No script yet.");

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
        {tab === "script" && script ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <FileText className="h-3 w-3" aria-hidden />
            {script.split(/\s+/).filter(Boolean).length} words
          </span>
        ) : null}
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border border-border/50 bg-background/40 p-4">
        <p
          className={cn(
            "whitespace-pre-line text-sm leading-relaxed text-foreground",
            tab === "brief" && "font-mono text-xs",
          )}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
