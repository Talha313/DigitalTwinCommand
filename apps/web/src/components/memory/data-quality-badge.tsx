import { cn } from "@/lib/utils";
import type { DataQuality } from "@/lib/mock-data/memory";

const META: Record<DataQuality, { label: string; className: string }> = {
  high: {
    label: "High quality",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  },
  medium: {
    label: "Medium",
    className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  },
  low: {
    label: "Low",
    className: "border-border bg-muted text-muted-foreground",
  },
};

export interface DataQualityBadgeProps {
  quality: DataQuality;
  showLabel?: boolean;
  className?: string;
}

export function DataQualityBadge({
  quality,
  showLabel = true,
  className,
}: DataQualityBadgeProps) {
  const meta = META[quality];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {showLabel ? meta.label : quality.toUpperCase()}
    </span>
  );
}
