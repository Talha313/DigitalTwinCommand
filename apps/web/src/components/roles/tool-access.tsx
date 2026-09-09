import { cn } from "@/lib/utils";
import type { RoleTool } from "@/lib/mock-data/types";

import { RiskBadge } from "./risk-badge";
import { toolIcon } from "./tool-icon";

export interface ToolAccessProps {
  tools: RoleTool[];
  className?: string;
}

export function ToolAccess({ tools, className }: ToolAccessProps) {
  return (
    <ul className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {tools.map((tool) => {
        const Icon = toolIcon(tool.id);
        return (
          <li
            key={tool.id}
            className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{tool.name}</p>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
              <RiskBadge
                level={tool.risk}
                showLabel={false}
                className="mt-1.5"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
