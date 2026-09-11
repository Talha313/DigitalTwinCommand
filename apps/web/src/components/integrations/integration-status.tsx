import { cn } from "@/lib/utils";
import { StatusDot, type StatusTone } from "@/components/ui/status-dot";
import type { IntegrationStatus } from "@/lib/integrations";

const META: Record<IntegrationStatus, { label: string; tone: StatusTone }> = {
  connected: { label: "Connected", tone: "positive" },
  error: { label: "Error", tone: "critical" },
  disabled: { label: "Not configured", tone: "neutral" },
};

export interface IntegrationStatusProps {
  status: IntegrationStatus;
  detail?: string | null;
  className?: string;
}

export function IntegrationStatus({
  status,
  detail,
  className,
}: IntegrationStatusProps) {
  const meta = META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground",
        className,
      )}
    >
      <StatusDot tone={meta.tone} pulse={status === "connected"} />
      {detail ?? meta.label}
    </span>
  );
}

export function integrationStatusLabel(status: IntegrationStatus): string {
  return META[status].label;
}
