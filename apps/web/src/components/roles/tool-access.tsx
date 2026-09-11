import { cn } from "@/lib/utils";
import type { RoleToolAccess } from "@/lib/roles";

import { toolIcon } from "./tool-icon";

export interface ToolAccessProps {
  tools: RoleToolAccess[];
  className?: string;
}

export function ToolAccess({ tools, className }: ToolAccessProps) {
  return (
    <ul className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {tools.map((access) => {
        const Icon = toolIcon(access.tool.id);
        return (
          <li
            key={access.tool.id}
            className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {access.tool.name}
              </p>
              {access.tool.description ? (
                <p className="text-xs text-muted-foreground">
                  {access.tool.description}
                </p>
              ) : null}
              {!access.enabled ? (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Disabled
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
