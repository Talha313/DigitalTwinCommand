"use client";

import * as React from "react";
import { Check, Copy, FileAudio, FileVideo, Subtitles, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ReportRead } from "@/lib/reports";

interface AssetRow {
  id: string;
  label: string;
  icon: LucideIcon;
  url: string | null;
}

export interface AssetListProps {
  report: ReportRead;
}

export function AssetList({ report }: AssetListProps) {
  const [copied, setCopied] = React.useState<string | null>(null);

  const rows: AssetRow[] = [
    { id: "audio", label: "Voice audio", icon: FileAudio, url: report.audio_url },
    { id: "video_16x9", label: "Video (16:9)", icon: FileVideo, url: report.video_16x9 },
    { id: "video_9x16", label: "Video (9:16)", icon: FileVideo, url: report.video_9x16 },
    { id: "captions", label: "Captions", icon: Subtitles, url: report.captions_url },
  ];

  const copyUrl = async (row: AssetRow) => {
    if (!row.url) return;
    try {
      await navigator.clipboard.writeText(row.url);
      setCopied(row.id);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable — non-fatal.
    }
  };

  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <li
            key={row.id}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{row.label}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {row.url ?? "not generated yet"}
              </p>
            </div>
            <p
              className={cn(
                "shrink-0 text-[11px] font-medium",
                row.url ? "text-emerald-300" : "text-muted-foreground",
              )}
            >
              {row.url ? "Available" : "Pending"}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={!row.url}
              onClick={() => copyUrl(row)}
              aria-label={`Copy URL for ${row.label}`}
            >
              {copied === row.id ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
