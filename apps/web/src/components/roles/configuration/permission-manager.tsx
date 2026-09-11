"use client";

import { Switch } from "@/components/ui/switch";
import { permissionCategory, type PermissionRead } from "@/lib/roles";

export interface PermissionManagerProps {
  permissions: PermissionRead[];
  value: string[];
  onChange: (ids: string[]) => void;
}

export function PermissionManager({
  permissions,
  value,
  onChange,
}: PermissionManagerProps) {
  const toggle = (id: string) =>
    onChange(
      value.includes(id)
        ? value.filter((entry) => entry !== id)
        : [...value, id],
    );

  const categories = Array.from(
    new Set(permissions.map((permission) => permissionCategory(permission.name))),
  ).sort();
  const groups = categories
    .map((category) => ({
      category,
      items: permissions.filter(
        (permission) => permissionCategory(permission.name) === category,
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Permissions</h3>
          <p className="text-xs text-muted-foreground">
            Enforced in the backend — never through prompts alone.
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {value.length} of {permissions.length} enabled
        </span>
      </div>

      <div className="divide-y divide-border/60">
        {groups.map((group) => (
          <div key={group.category} className="p-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.category}
            </p>
            <ul className="space-y-2">
              {group.items.map((permission) => {
                const enabled = value.includes(permission.id);
                return (
                  <li
                    key={permission.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
                  >
                    <div className="min-w-0">
                      <span
                        id={`perm-${permission.id}`}
                        className="font-mono text-xs text-primary"
                      >
                        {permission.name}
                      </span>
                      {permission.description ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      ) : null}
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggle(permission.id)}
                      aria-labelledby={`perm-${permission.id}`}
                      className="mt-0.5"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
