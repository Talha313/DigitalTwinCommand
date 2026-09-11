"use client";

import type { IntegrationRead } from "@/lib/integrations";

import { IntegrationCard } from "./integration-card";

export interface IntegrationListProps {
  integrations: IntegrationRead[];
  onConfigure: (id: string) => void;
}

export function IntegrationList({
  integrations,
  onConfigure,
}: IntegrationListProps) {
  const connected = integrations.filter((i) => i.status === "connected").length;
  const errored = integrations.filter((i) => i.status === "error").length;
  const disabled = integrations.filter((i) => i.status === "disabled").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-md border border-border/60 bg-card px-2.5 py-1 text-foreground">
          {connected} connected
        </span>
        {errored > 0 ? (
          <span className="rounded-md border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-rose-300">
            {errored} need attention
          </span>
        ) : null}
        {disabled > 0 ? (
          <span className="rounded-md border border-border/60 bg-card px-2.5 py-1 text-muted-foreground">
            {disabled} not configured
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConfigure={() => onConfigure(integration.id)}
          />
        ))}
      </div>
    </div>
  );
}
