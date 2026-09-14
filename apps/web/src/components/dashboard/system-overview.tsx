"use client";

import { Bot, Database, FileBarChart, PhoneCall, Radio, type LucideIcon } from "lucide-react";

import { StatusDot } from "@/components/ui/status-dot";
import { useHealth } from "@/hooks/use-health";
import { cn } from "@/lib/utils";

type MetricTone = "positive" | "neutral" | "warning";

interface Metric {
  id: string;
  label: string;
  value: string;
  detail?: string;
  positive: boolean;
  tone: MetricTone;
  icon: LucideIcon;
}

const TONE_CLASS: Record<MetricTone, string> = {
  positive: "text-emerald-300",
  neutral: "text-foreground",
  warning: "text-amber-300",
};

/** Derives the four metric tiles straight from GET /api/health — no
 * separate mock list. Mirrors the fields wired in TwinStatusCard, since
 * both widgets legitimately read the same health snapshot. */
export function SystemOverview({ className }: { className?: string }) {
  const { health, loading, error } = useHealth();

  const metrics: Metric[] = health
    ? [
        {
          id: "voice",
          label: "Voice service",
          value: health.integrations.elevenlabs ? "Connected" : "Not configured",
          detail: health.call_llm,
          positive: health.integrations.elevenlabs,
          tone: health.integrations.elevenlabs ? "positive" : "warning",
          icon: Radio,
        },
        {
          id: "ai-model",
          label: "AI model",
          value: health.integrations.xai ? "Ready" : "Not configured",
          detail: health.chat_llm,
          positive: health.integrations.xai,
          tone: health.integrations.xai ? "positive" : "warning",
          icon: Bot,
        },
        {
          id: "telephony",
          label: "Telephony",
          value: health.integrations.twilio ? "Connected" : "Not configured",
          detail: "Twilio",
          positive: health.integrations.twilio,
          tone: health.integrations.twilio ? "positive" : "warning",
          icon: PhoneCall,
        },
        {
          id: "storage",
          label: "Storage",
          value: health.integrations.storage ? "Connected" : "Unavailable",
          detail: health.storage,
          positive: health.integrations.storage,
          tone: health.integrations.storage ? "positive" : "warning",
          icon: FileBarChart,
        },
      ]
    : [];

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {loading ? (
        <p className="col-span-full text-sm text-muted-foreground">
          Loading system status…
        </p>
      ) : error ? (
        <p className="col-span-full text-sm text-destructive">{error}</p>
      ) : (
        metrics.map((metric) => {
          const Icon = metric.icon ?? Database;
          return (
            <div
              key={metric.id}
              className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/60">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <StatusDot tone={metric.positive ? "positive" : "warning"} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className={cn("mt-0.5 text-lg font-semibold", TONE_CLASS[metric.tone])}>
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
        })
      )}
    </div>
  );
}
