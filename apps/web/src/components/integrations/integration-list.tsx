"use client";

import { integrations as allIntegrations } from "@/lib/mock-data/integrations";
import type { Integration } from "@/lib/mock-data/integrations";

import { IntegrationCard } from "./integration-card";

export interface IntegrationListProps {
  integrations?: Integration[];
  onConfigure: (id: string) => void;
}

export function IntegrationList({
  integrations = allIntegrations,
  onConfigure,
}: IntegrationListProps) {
  const connected = integrations.filter((i) => i.status === "connected").length;
  const needsAction = integrations.filter(
    (i) => i.status === "action_required",
  ).length;
  const notConfigured = integrations.filter(
    (i) => i.status === "not_configured" || i.status === "error",
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-md border border-border/60 bg-card px-2.5 py-1 text-foreground">
          {connected} connected
        </span>
        {needsAction > 0 ? (
          <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-amber-300">
            {needsAction} need attention
          </span>
        ) : null}
        {notConfigured > 0 ? (
          <span className="rounded-md border border-border/60 bg-card px-2.5 py-1 text-muted-foreground">
            {notConfigured} not configured
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
