import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { StatusDot, type StatusTone } from "@/components/ui/status-dot";
import type { ReportStatus as BackendReportStatus } from "@/lib/reports";

const META: Record<
  BackendReportStatus,
  { label: string; tone: StatusTone; busy: boolean }
> = {
  queued: { label: "Queued", tone: "neutral", busy: false },
  researching: { label: "Researching", tone: "warning", busy: true },
  script_ready: { label: "Script ready", tone: "warning", busy: false },
  approved: { label: "Approved", tone: "warning", busy: false },
  generating: { label: "Generating", tone: "warning", busy: true },
  awaiting_avatar: { label: "Awaiting avatar", tone: "warning", busy: false },
  ready: { label: "Ready", tone: "positive", busy: false },
  failed: { label: "Failed", tone: "critical", busy: false },
};

export interface ReportStatusProps {
  status: BackendReportStatus;
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
        <StatusDot tone={meta.tone} pulse={status === "ready"} />
      )}
      {meta.label}
    </span>
  );
}

export function reportStatusLabel(status: BackendReportStatus): string {
  return META[status].label;
}
