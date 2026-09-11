"use client";

import * as React from "react";
import { Bot, Database, Mic, ShieldCheck, Sparkles, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusDot, type StatusTone } from "@/components/ui/status-dot";
import { useHealth } from "@/hooks/use-health";
import { listRoles, type RoleRead } from "@/lib/roles";

import { DashboardCard } from "./dashboard-card";
import { RoleBadge } from "./role-badge";

interface FieldProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: StatusTone;
}

function Field({ icon: Icon, label, value, tone }: FieldProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
        {tone ? <StatusDot tone={tone} /> : null}
        {value}
      </p>
    </div>
  );
}

function toneFor(ok: boolean): StatusTone {
  return ok ? "positive" : "warning";
}

/** Live operational state, derived from GET /api/health (integrations,
 * database) plus GET /api/roles for the active-roles list — no more
 * fabricated "listening/thinking" twin mode, since the backend has no
 * global twin-mode concept outside of a single live call. */
export function TwinStatusCard({ className }: { className?: string }) {
  const { health, loading: healthLoading, error: healthError } = useHealth();
  const [roles, setRoles] = React.useState<RoleRead[] | null>(null);
  const [rolesError, setRolesError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    listRoles()
      .then((rows) => {
        if (!cancelled) setRoles(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setRolesError(err instanceof Error ? err.message : "Failed to load roles.");
          setRoles([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const online = health?.status === "ok";
  const activeRoles = (roles ?? []).filter((role) => role.is_active);

  return (
    <DashboardCard
      className={className}
      title="Digital Twin"
      description="Live operational state"
      icon={Sparkles}
      action={
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-2.5 py-1 text-xs font-medium text-foreground">
          <StatusDot tone={online ? "positive" : "critical"} pulse={online} />
          {healthLoading ? "Checking…" : online ? "Online" : "Degraded"}
        </span>
      }
    >
      {healthLoading ? (
        <p className="text-sm text-muted-foreground">Loading system status…</p>
      ) : healthError || !health ? (
        <p className="text-sm text-destructive">
          {healthError ?? "Failed to load system status."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            icon={Mic}
            label="Voice"
            value={health.integrations.elevenlabs ? "Connected" : "Not configured"}
            tone={toneFor(health.integrations.elevenlabs)}
          />
          <Field
            icon={Bot}
            label="AI engine"
            value={health.integrations.anthropic ? "Ready" : "Not configured"}
            tone={toneFor(health.integrations.anthropic)}
          />
          <Field
            icon={Video}
            label="Lip-sync"
            value={health.integrations.lipsync ? "Ready" : "Not configured"}
            tone={toneFor(health.integrations.lipsync)}
          />
          <Field
            icon={Database}
            label="Database"
            value={health.database ? "Connected" : "Error"}
            tone={toneFor(health.database)}
          />
        </div>
      )}

      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Active roles
        </p>
        <div className="flex flex-wrap gap-2">
          {roles === null ? (
            <p className="text-xs text-muted-foreground">Loading roles…</p>
          ) : rolesError ? (
            <p className="text-xs text-destructive">{rolesError}</p>
          ) : activeRoles.length === 0 ? (
            <p className="text-xs text-muted-foreground">No active roles.</p>
          ) : (
            activeRoles.map((role) => <RoleBadge key={role.id} name={role.name} />)
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
