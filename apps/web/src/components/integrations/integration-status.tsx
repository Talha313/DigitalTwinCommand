import { cn } from "@/lib/utils";
import { StatusDot, type StatusTone } from "@/components/ui/status-dot";
import type { IntegrationStatusId } from "@/lib/mock-data/integrations";

const META: Record<
  IntegrationStatusId,
  { label: string; tone: StatusTone }
> = {
  connected: { label: "Connected", tone: "positive" },
  action_required: { label: "Action required", tone: "warning" },
  not_configured: { label: "Not configured", tone: "neutral" },
  error: { label: "Error", tone: "critical" },
};

export interface IntegrationStatusProps {
  status: IntegrationStatusId;
  detail?: string;
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

export function integrationStatusLabel(status: IntegrationStatusId): string {
  return META[status].label;
}
