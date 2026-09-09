"use client";

import * as React from "react";
import { Clapperboard, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ReportAsset } from "@/lib/mock-data/reports";

type Format = "16_9" | "9_16";

export interface VideoPreviewProps {
  assets: ReportAsset[];
}

export function VideoPreview({ assets }: VideoPreviewProps) {
  const [format, setFormat] = React.useState<Format>("16_9");

  const asset = assets.find((entry) =>
    format === "16_9" ? entry.type === "video_16_9" : entry.type === "video_9_16",
  );
  const available = asset?.status === "available";

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
          format === "16_9"
            ? "aspect-video w-full"
            : "aspect-[9/16] w-full max-w-[240px]",
        )}
      >
        {available ? (
          <button
            type="button"
            aria-label="Play preview (not wired)"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform hover:scale-105"
          >
            <Play className="h-6 w-6 translate-x-0.5" aria-hidden />
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
            <Clapperboard className="h-6 w-6" aria-hidden />
            <p className="text-xs">
              {asset?.status === "failed"
                ? "Render failed"
                : "Rendering in progress"}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="truncate font-mono">
          {asset ? asset.filename : "—"}
        </span>
        <span>{available ? asset?.sizeLabel : "not available"}</span>
      </div>
      <p className="text-[11px] text-muted-foreground/70">
        Preview only — playback is not wired in this build.
      </p>
    </div>
  );
}
