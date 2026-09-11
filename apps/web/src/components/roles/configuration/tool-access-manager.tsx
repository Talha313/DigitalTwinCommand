"use client";

import { toolIcon } from "@/components/roles/tool-icon";
import { Switch } from "@/components/ui/switch";
import type { ToolRead } from "@/lib/roles";

export interface ToolAccessManagerProps {
  tools: ToolRead[];
  value: string[];
  onChange: (ids: string[]) => void;
}

export function ToolAccessManager({
  tools,
  value,
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
          {value.length} of {tools.length} enabled
        </span>
      </div>

      <ul className="divide-y divide-border/60">
        {tools.map((tool) => {
          const enabled = value.includes(tool.id);
          const Icon = toolIcon(tool.id);

          return (
            <li key={tool.id} className="flex items-start gap-3 p-5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <span
                  id={`tool-${tool.id}`}
                  className="text-sm font-medium text-foreground"
                >
                  {tool.name}
                </span>
                {tool.description ? (
                  <p className="text-xs text-muted-foreground">
                    {tool.description}
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
