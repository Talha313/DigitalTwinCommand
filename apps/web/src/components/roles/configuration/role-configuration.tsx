"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RiskBadge } from "@/components/roles/risk-badge";
import type { RoleConfigDraft } from "@/lib/mock-data/role-config";
import type {
  ResponseStyleId,
  ToneId,
} from "@/lib/mock-data/role-config";
import type { RiskLevel } from "@/lib/mock-data/types";

import { PermissionManager } from "./permission-manager";
import { PersonalitySettings } from "./personality-settings";
import { RiskSelector } from "./risk-selector";
import { SaveRoleButton } from "./save-role-button";
import { ToolAccessManager } from "./tool-access-manager";

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}

function isEqual(a: RoleConfigDraft, b: RoleConfigDraft): boolean {
  return (
    a.tone === b.tone &&
    a.responseStyle === b.responseStyle &&
    a.riskLevel === b.riskLevel &&
    sameSet(a.behaviorPreferences, b.behaviorPreferences) &&
    sameSet(a.permissionIds, b.permissionIds) &&
    sameSet(a.toolIds, b.toolIds)
  );
}

export interface RoleConfigurationProps {
  initialConfig: RoleConfigDraft;
}

export function RoleConfiguration({ initialConfig }: RoleConfigurationProps) {
  const [saved, setSaved] = React.useState<RoleConfigDraft>(initialConfig);
  const [draft, setDraft] = React.useState<RoleConfigDraft>(initialConfig);

  const dirty = !isEqual(draft, saved);

  const update = <K extends keyof RoleConfigDraft>(
    key: K,
    value: RoleConfigDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const save = async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSaved(draft);
  };

  const discard = () => setDraft(saved);

  return (
    <>
      <div className="flex flex-col gap-3">
        <Link
          href="/roles"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to roles
        </Link>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {draft.roleName}
            </h2>
            <p className="text-sm text-muted-foreground">Role configuration</p>
          </div>
          <RiskBadge level={draft.riskLevel} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PersonalitySettings
          tone={draft.tone}
          responseStyle={draft.responseStyle}
          preferences={draft.behaviorPreferences}
          onToneChange={(tone: ToneId) => update("tone", tone)}
          onResponseStyleChange={(style: ResponseStyleId) =>
            update("responseStyle", style)
          }
          onPreferencesChange={(ids) => update("behaviorPreferences", ids)}
        />
        <RiskSelector
          value={draft.riskLevel}
          onChange={(level: RiskLevel) => update("riskLevel", level)}
        />
      </div>

      <PermissionManager
        value={draft.permissionIds}
        onChange={(ids) => update("permissionIds", ids)}
      />

      <ToolAccessManager
        value={draft.toolIds}
        permissionIds={draft.permissionIds}
        onChange={(ids) => update("toolIds", ids)}
      />

      <SaveRoleButton dirty={dirty} onSave={save} onDiscard={discard} />
    </>
  );
}
