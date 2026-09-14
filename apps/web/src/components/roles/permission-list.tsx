import { cn } from "@/lib/utils";
import type { PermissionRead } from "@/lib/roles";

export interface PermissionListProps {
  permissions: PermissionRead[];
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
            <p className="font-mono text-xs text-primary">{permission.name}</p>
            {permission.description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {permission.description}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
