"use client";

import * as React from "react";

import { Switch } from "@/components/ui/switch";
import type { RoleRead } from "@/lib/roles";

import { RiskBadge } from "./risk-badge";

interface SettingRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
      <div className="min-w-0">
        <span id={`${id}-label`} className="block text-sm text-foreground">
          {label}
        </span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={`${id}-label`}
      />
    </div>
  );
}

export interface RoleSettingsProps {
  role: RoleRead;
}

export function RoleSettings({ role }: RoleSettingsProps) {
  const [active, setActive] = React.useState(role.is_active);
  const [requireApproval, setRequireApproval] = React.useState(
    role.risk_level === "high",
  );

  // Re-sync when a different role is opened in the same drawer instance.
  React.useEffect(() => {
    setActive(role.is_active);
    setRequireApproval(role.risk_level === "high");
  }, [role]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Changes here are a UI preview and are not persisted yet.
      </p>

      <SettingRow
        id={`${role.id}-active`}
        label="Role active"
        description="Available for assignment to calls and chats."
        checked={active}
        onCheckedChange={setActive}
      />
      <SettingRow
        id={`${role.id}-approval`}
        label="Require approval for high-risk actions"
        description="Operator must confirm before a high-risk tool runs."
        checked={requireApproval}
        onCheckedChange={setRequireApproval}
      />

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
        <div className="min-w-0">
          <p className="text-sm text-foreground">Risk level</p>
          <p className="text-xs text-muted-foreground">
            Derived from the role&apos;s most sensitive capability.
          </p>
        </div>
        <RiskBadge level={role.risk_level} />
      </div>

      {role.tone ? (
        <div className="rounded-lg border border-border/50 bg-background/40 p-3">
          <p className="text-sm text-foreground">Tone</p>
          <p className="text-xs text-muted-foreground">{role.tone}</p>
        </div>
      ) : null}
    </div>
  );
}
