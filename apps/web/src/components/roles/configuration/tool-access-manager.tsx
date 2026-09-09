"use client";

import { TriangleAlert } from "lucide-react";

import { RiskBadge } from "@/components/roles/risk-badge";
import { toolIcon } from "@/components/roles/tool-icon";
import { Switch } from "@/components/ui/switch";
import { TOOL_CATALOG } from "@/lib/mock-data/role-config";

export interface ToolAccessManagerProps {
  value: string[];
  permissionIds: string[];
  onChange: (ids: string[]) => void;
}

export function ToolAccessManager({
  value,
  permissionIds,
  onChange,
}: ToolAccessManagerProps) {
  const toggle = (id: string) =>
    onChange(
      value.includes(id)
        ? value.filter((entry) => entry !== id)
        : [...value, id],
    );

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Tool &amp; API access
          </h3>
          <p className="text-xs text-muted-foreground">
            The Twin only receives the tools enabled here for this role.
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {value.length} of {TOOL_CATALOG.length} enabled
        </span>
      </div>

      <ul className="divide-y divide-border/60">
        {TOOL_CATALOG.map((tool) => {
          const enabled = value.includes(tool.id);
          const Icon = toolIcon(tool.id);
          const missingPermission =
            enabled &&
            tool.requiresPermission != null &&
            !permissionIds.includes(tool.requiresPermission);

          return (
            <li key={tool.id} className="flex items-start gap-3 p-5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    id={`tool-${tool.id}`}
                    className="text-sm font-medium text-foreground"
                  >
                    {tool.name}
                  </span>
                  <RiskBadge level={tool.risk} showLabel={false} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {tool.description}
                </p>
                {tool.requiresPermission ? (
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    requires {tool.requiresPermission}
                  </p>
                ) : null}
                {missingPermission ? (
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-amber-300">
                    <TriangleAlert className="h-3 w-3" aria-hidden />
                    Enable {tool.requiresPermission} for this tool to work.
                  </p>
                ) : null}
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={() => toggle(tool.id)}
                aria-labelledby={`tool-${tool.id}`}
                className="mt-0.5"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
