"use client";

import {
  Check,
  Clapperboard,
  Database,
  Phone,
  Sparkles,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Integration } from "@/lib/mock-data/integrations";

import { IntegrationStatus } from "./integration-status";

const ICON: Record<string, LucideIcon> = {
  twilio: Phone,
  elevenlabs: Waves,
  anthropic: Sparkles,
  heygen: Clapperboard,
  s3: Database,
};

export interface IntegrationCardProps {
  integration: Integration;
  onConfigure: () => void;
}

export function IntegrationCard({
  integration,
  onConfigure,
}: IntegrationCardProps) {
  const Icon = ICON[integration.id] ?? Sparkles;

  return (
    <article className="flex flex-col rounded-xl border border-border/60 bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-primary">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              {integration.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {integration.category} · {integration.purpose}
            </p>
          </div>
        </div>
        <IntegrationStatus
          status={integration.status}
          className="shrink-0"
        />
      </div>

      <div className="flex-1 space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          {integration.description}
        </p>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Capabilities
          </p>
          <ul className="mt-1.5 space-y-1">
            {integration.capabilities.map((capability) => (
              <li
                key={capability.id}
                className="flex items-center gap-2 text-xs"
              >
                {capability.enabled ? (
                  <Check
                    className="h-3.5 w-3.5 shrink-0 text-emerald-300"
                    aria-hidden
                  />
                ) : (
                  <X
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                    aria-hidden
                  />
                )}
                <span
                  className={
                    capability.enabled
                      ? "text-foreground"
                      : "text-muted-foreground/70"
                  }
                >
                  {capability.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Environment
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {integration.fields.map((field) => (
              <span
                key={field.key}
                className="rounded border border-border/60 bg-background/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                {field.key}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 p-3">
        <span className="text-[11px] text-muted-foreground">
          {integration.lastCheckedLabel ?? "Never checked"}
        </span>
        <Button variant="outline" size="sm" onClick={onConfigure}>
          Configure
        </Button>
      </div>
    </article>
  );
}
