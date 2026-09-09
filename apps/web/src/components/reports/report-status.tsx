import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { StatusDot, type StatusTone } from "@/components/ui/status-dot";
import type { ReportGenerationStatus } from "@/lib/mock-data/reports";

const META: Record<
  ReportGenerationStatus,
  { label: string; tone: StatusTone; busy: boolean }
> = {
  QUEUED: { label: "Queued", tone: "neutral", busy: false },
  RESEARCHING: { label: "Researching", tone: "warning", busy: true },
  SCRIPTING: { label: "Scripting", tone: "warning", busy: true },
  AWAITING_APPROVAL: { label: "Awaiting approval", tone: "warning", busy: false },
  GENERATING_AUDIO: { label: "Generating audio", tone: "warning", busy: true },
  GENERATING_VIDEO: { label: "Generating video", tone: "warning", busy: true },
  PROCESSING_VIDEO: { label: "Processing video", tone: "warning", busy: true },
  UPLOADING: { label: "Uploading", tone: "warning", busy: true },
  READY: { label: "Ready", tone: "positive", busy: false },
  FAILED: { label: "Failed", tone: "critical", busy: false },
};

export interface ReportStatusProps {
  status: ReportGenerationStatus;
  className?: string;
}

export function ReportStatus({ status, className }: ReportStatusProps) {
  const meta = META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground",
        className,
      )}
    >
      {meta.busy ? (
        <Loader2 className="h-3 w-3 animate-spin text-primary" aria-hidden />
      ) : (
        <StatusDot tone={meta.tone} pulse={status === "READY"} />
      )}
      {meta.label}
    </span>
  );
}

export function reportStatusLabel(status: ReportGenerationStatus): string {
  return META[status].label;
}
