"use client";

import * as React from "react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { RiskBadge } from "@/components/roles/risk-badge";
import { RoleCard } from "@/components/roles/role-card";
import { RoleDetails } from "@/components/roles/role-details";
import { RoleSelector } from "@/components/roles/role-selector";
import { roles } from "@/lib/mock-data/roles";
import type { RiskLevel } from "@/lib/mock-data/types";

const RISK_ORDER: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };

function uniqueCount(values: string[]): number {
  return new Set(values).size;
}

export function RolesClient() {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string[]>([
    "financial",
    "operator",
  ]);

  const activeRole = roles.find((role) => role.id === activeId) ?? null;
  const selectedRoles = roles.filter((role) => selected.includes(role.id));

  const combinedRisk = selectedRoles.reduce<RiskLevel>(
    (acc, role) =>
      RISK_ORDER[role.riskLevel] > RISK_ORDER[acc] ? role.riskLevel : acc,
    "low",
  );

  return (
    <>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">AI Roles</h2>
        <p className="text-sm text-muted-foreground">
          One Digital Twin, many roles. Assign one or more roles per call, chat,
          or session — the selection drives the system prompt, tone, permissions,
          and available tools.
        </p>
      </div>

      <DashboardCard
        title="Session role assignment"
        description="Preview of the selector reused in Chat and Live Calls"
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
          <RoleSelector
            value={selected}
            onChange={setSelected}
            legend="Active roles"
            description="Select the roles this Twin session should operate under."
          />

          <div className="rounded-lg border border-border/50 bg-background/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Resolved configuration
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Roles</dt>
                <dd className="font-medium text-foreground">
                  {selectedRoles.length || "None"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Combined risk</dt>
                <dd>
                  {selectedRoles.length > 0 ? (
                    <RiskBadge level={combinedRisk} />
                  ) : (
                    <span className="text-muted-foreground">&mdash;</span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Tools unlocked</dt>
                <dd className="font-medium text-foreground">
                  {uniqueCount(
                    selectedRoles.flatMap((role) =>
                      role.tools.map((tool) => tool.id),
                    ),
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Permissions</dt>
                <dd className="font-medium text-foreground">
                  {uniqueCount(
                    selectedRoles.flatMap((role) =>
                      role.permissions.map((permission) => permission.id),
                    ),
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </DashboardCard>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            selected={selected.includes(role.id)}
            onViewDetails={() => setActiveId(role.id)}
          />
        ))}
      </div>

      <RoleDetails
        role={activeRole}
        open={activeRole !== null}
        onOpenChange={(open) => {
          if (!open) setActiveId(null);
        }}
      />
    </>
  );
}
