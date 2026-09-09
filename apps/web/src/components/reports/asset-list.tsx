"use client";

import * as React from "react";
import {
  Check,
  Copy,
  FileAudio,
  FileText,
  FileVideo,
  Subtitles,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type {
  ReportAsset,
  ReportAssetType,
} from "@/lib/mock-data/reports";

const ASSET_ICON: Record<ReportAssetType, LucideIcon> = {
  brief: FileText,
  script: FileText,
  audio: FileAudio,
  video_16_9: FileVideo,
  video_9_16: FileVideo,
  captions: Subtitles,
};

const STATUS_META: Record<
  ReportAsset["status"],
  { label: string; className: string }
> = {
  available: { label: "Available", className: "text-emerald-300" },
  pending: { label: "Pending", className: "text-muted-foreground" },
  failed: { label: "Failed", className: "text-rose-300" },
};

export interface AssetListProps {
  assets: ReportAsset[];
}

export function AssetList({ assets }: AssetListProps) {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyPath = async (asset: ReportAsset) => {
    if (!asset.storageKey) return;
    try {
      await navigator.clipboard.writeText(asset.storageKey);
      setCopied(asset.id);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable — non-fatal.
    }
  };

  return (
    <ul className="space-y-2">
      {assets.map((asset) => {
        const Icon = ASSET_ICON[asset.type];
        const meta = STATUS_META[asset.status];
        return (
          <li
            key={asset.id}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{asset.label}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {asset.storageKey ?? asset.filename}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn("text-[11px] font-medium", meta.className)}>
                {meta.label}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {asset.sizeLabel}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={asset.status !== "available"}
              onClick={() => copyPath(asset)}
              aria-label={`Copy storage path for ${asset.label}`}
            >
              {copied === asset.id ? (
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
