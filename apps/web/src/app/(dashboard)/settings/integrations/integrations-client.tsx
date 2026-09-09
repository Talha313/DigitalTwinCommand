"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { IntegrationList } from "@/components/integrations/integration-list";
import { IntegrationModal } from "@/components/integrations/integration-modal";
import { getIntegration } from "@/lib/mock-data/integrations";

export function IntegrationsClient() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = selectedId ? (getIntegration(selectedId) ?? null) : null;

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

      <IntegrationList onConfigure={setSelectedId} />

      <IntegrationModal
        integration={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </PageContainer>
  );
}
