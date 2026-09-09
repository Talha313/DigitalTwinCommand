import { cn } from "@/lib/utils";
import type { RolePermission } from "@/lib/mock-data/types";

import { RiskBadge } from "./risk-badge";

export interface PermissionListProps {
  permissions: RolePermission[];
  className?: string;
}

export function PermissionList({
  permissions,
  className,
}: PermissionListProps) {
  return (
    <ul className={cn("space-y-2", className)}>
      {permissions.map((permission) => (
        <li
          key={permission.id}
          className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
        >
          <div className="min-w-0">
            <p className="font-mono text-xs text-primary">{permission.id}</p>
            <p className="mt-0.5 text-sm text-foreground">{permission.label}</p>
            <p className="text-xs text-muted-foreground">
              {permission.description}
            </p>
          </div>
          <RiskBadge
            level={permission.risk}
            showLabel={false}
            className="shrink-0"
          />
        </li>
      ))}
    </ul>
  );
}
