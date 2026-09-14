"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RiskBadge } from "@/components/roles/risk-badge";
import {
  getRole,
  listPermissions,
  listTools,
  updateRole,
  type PermissionRead,
  type RiskLevel,
  type RoleRead,
  type RoleUpdate,
  type ToolRead,
} from "@/lib/roles";
import { PermissionManager } from "./permission-manager";
import { PersonalitySettings } from "./personality-settings";
import { RiskSelector } from "./risk-selector";
import { SaveRoleButton } from "./save-role-button";
import { ToolAccessManager } from "./tool-access-manager";

/**
 * Mirrors the tone/response-style vocabularies from the role config
 * options module (TONE_OPTIONS / RESPONSE_STYLE_OPTIONS) — fixed UI
 * presets, not backend data, so duplicated here as literal types to
 * keep this file free of mock-data imports.
 */
type ToneId = "formal" | "professional" | "warm" | "direct" | "casual";
type ResponseStyleId = "concise" | "balanced" | "detailed";

const KNOWN_TONE_IDS: ToneId[] = [
  "formal",
  "professional",
  "warm",
  "direct",
  "casual",
];

const DEFAULT_TONE: ToneId = "professional";
const DEFAULT_RESPONSE_STYLE: ResponseStyleId = "balanced";

function isToneId(value: string | null | undefined): value is ToneId {
  return KNOWN_TONE_IDS.includes(value as ToneId);
}

interface EditableDraft {
  tone: ToneId;
  responseStyle: ResponseStyleId;
  behaviorPreferences: string[];
  riskLevel: RiskLevel;
  permissionIds: string[];
  toolIds: string[];
}

function draftFromRole(role: RoleRead): EditableDraft {
  return {
    tone: isToneId(role.tone) ? role.tone : DEFAULT_TONE,
    responseStyle: role.personality?.responseStyle ?? DEFAULT_RESPONSE_STYLE,
    behaviorPreferences: role.personality?.behaviorPreferences ?? [],
    riskLevel: role.risk_level,
    permissionIds: role.permissions.map((permission) => permission.id),
    toolIds: role.tools
      .filter((access) => access.enabled)
      .map((access) => access.tool.id),
  };
}

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}

function isEqual(a: EditableDraft, b: EditableDraft): boolean {
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
  roleId: string;
}

export function RoleConfiguration({ roleId }: RoleConfigurationProps) {
  const [role, setRole] = React.useState<RoleRead | null>(null);
  const [permissions, setPermissions] = React.useState<PermissionRead[]>([]);
  const [tools, setTools] = React.useState<ToolRead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [saved, setSaved] = React.useState<EditableDraft | null>(null);
  const [draft, setDraft] = React.useState<EditableDraft | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    Promise.all([getRole(roleId), listPermissions(), listTools()])
      .then(([fetchedRole, fetchedPermissions, fetchedTools]) => {
        if (cancelled) return;
        setRole(fetchedRole);
        setPermissions(fetchedPermissions);
        setTools(fetchedTools);
        const initial = draftFromRole(fetchedRole);
        setSaved(initial);
        setDraft(initial);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roleId]);

  const dirty = draft !== null && saved !== null && !isEqual(draft, saved);

  const update = <K extends keyof EditableDraft>(
    key: K,
    value: EditableDraft[K],
  ) => setDraft((current) => (current ? { ...current, [key]: value } : current));

  const save = async () => {
    if (!draft) return;
    const patch: RoleUpdate = {
      risk_level: draft.riskLevel,
      tone: draft.tone,
      permission_ids: draft.permissionIds,
      tool_ids: draft.toolIds,
      personality: {
        summary: role?.personality?.summary,
        traits: role?.personality?.traits,
        systemPromptPreview: role?.personality?.systemPromptPreview,
        responseStyle: draft.responseStyle,
        behaviorPreferences: draft.behaviorPreferences,
      },
    };
    const updated = await updateRole(roleId, patch);
    setRole(updated);
    const next = draftFromRole(updated);
    setSaved(next);
    setDraft(next);
  };

  const discard = () => setDraft(saved);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading role…
      </div>
    );
  }

  if (notFound || !role || !draft) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Role not found.</p>
        <Link
          href="/roles"
          className="text-xs font-medium text-primary hover:underline"
        >
          Back to roles
        </Link>
      </div>
    );
  }

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
              {role.name}
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
        permissions={permissions}
        value={draft.permissionIds}
        onChange={(ids) => update("permissionIds", ids)}
      />

      <ToolAccessManager
        tools={tools}
        value={draft.toolIds}
        onChange={(ids) => update("toolIds", ids)}
      />

      <SaveRoleButton dirty={dirty} onSave={save} onDiscard={discard} />
    </>
  );
}
