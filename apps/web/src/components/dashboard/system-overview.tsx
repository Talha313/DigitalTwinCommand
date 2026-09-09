import {
  Bot,
  FileBarChart,
  PhoneCall,
  Radio,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/status-dot";
import { systemMetrics } from "@/lib/mock-data/dashboard";
import type { MetricTone, SystemMetric } from "@/lib/mock-data/types";

const METRIC_ICON: Record<string, LucideIcon> = {
  voice: Radio,
  "ai-model": Bot,
  "calls-today": PhoneCall,
  "reports-generated": FileBarChart,
};

const TONE_CLASS: Record<MetricTone, string> = {
  positive: "text-emerald-300",
  neutral: "text-foreground",
  warning: "text-amber-300",
};

export function SystemOverview({
  metrics = systemMetrics,
  className,
}: {
  metrics?: SystemMetric[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {metrics.map((metric) => {
        const Icon = METRIC_ICON[metric.id] ?? Bot;
        const positive =
          metric.state === "connected" || metric.state === "ready";
        return (
          <div
            key={metric.id}
            className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/60">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
              </span>
              {metric.state ? (
                <StatusDot tone={positive ? "positive" : "warning"} />
              ) : null}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p
                className={cn(
                  "mt-0.5 text-lg font-semibold",
                  TONE_CLASS[metric.tone ?? "neutral"],
                )}
              >
                {metric.value}
              </p>
              {metric.detail ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {metric.detail}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
