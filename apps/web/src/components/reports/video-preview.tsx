"use client";

import * as React from "react";
import { Clapperboard } from "lucide-react";

import { cn } from "@/lib/utils";

type Format = "16_9" | "9_16";

export interface VideoPreviewProps {
  video16x9: string | null;
  video9x16: string | null;
}

export function VideoPreview({ video16x9, video9x16 }: VideoPreviewProps) {
  const [format, setFormat] = React.useState<Format>("16_9");
  const url = format === "16_9" ? video16x9 : video9x16;

  return (
    <div className="space-y-3">
      <div className="flex gap-1" role="group" aria-label="Video format">
        {(
          [
            { id: "16_9", label: "16:9" },
            { id: "9_16", label: "9:16" },
          ] as { id: Format; label: string }[]
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={format === option.id}
            onClick={() => setFormat(option.id)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              format === option.id
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "mx-auto flex items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-slate-900 via-background to-slate-900",
          format === "16_9" ? "aspect-video w-full" : "aspect-[9/16] w-full max-w-[240px]",
        )}
      >
        {url ? (
          <video src={url} controls className="h-full w-full" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
            <Clapperboard className="h-6 w-6" aria-hidden />
            <p className="text-xs">Not generated yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
