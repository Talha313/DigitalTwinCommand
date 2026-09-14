"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { IntegrationList } from "@/components/integrations/integration-list";
import { IntegrationModal } from "@/components/integrations/integration-modal";
import { ApiError } from "@/lib/api-client";
import { listIntegrations, type IntegrationRead } from "@/lib/integrations";

export function IntegrationsClient() {
  const [integrations, setIntegrations] = React.useState<IntegrationRead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    listIntegrations()
      .then((data) => {
        if (!cancelled) setIntegrations(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load integrations.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = integrations.find((i) => i.id === selectedId) ?? null;

  const handleUpdated = (updated: IntegrationRead) => {
    setIntegrations((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-3">
        <Link
          href="/settings"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Settings
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Third-party services the Digital Twin depends on. Credentials are
            managed server-side — this screen is for review and configuration.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading integrations…</p>
      ) : error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : (
        <IntegrationList integrations={integrations} onConfigure={setSelectedId} />
      )}

      <IntegrationModal
        integration={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onUpdated={handleUpdated}
      />
    </PageContainer>
  );
}
