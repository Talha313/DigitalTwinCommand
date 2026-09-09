"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { roles as defaultRoles } from "@/lib/mock-data/roles";
import type { Role } from "@/lib/mock-data/types";

import { RiskBadge } from "./risk-badge";

export interface RoleSelectorProps {
  /** Selected role ids. */
  value: string[];
  onChange: (roleIds: string[]) => void;
  roles?: Role[];
  legend?: string;
  description?: string;
  columns?: 1 | 2;
  className?: string;
}

/**
 * Reusable multi-select for Twin roles.
 * Reused by the Roles screen, and later by Chat and Live Calls.
 */
export function RoleSelector({
  value,
  onChange,
  roles = defaultRoles,
  legend = "Twin roles",
  description,
  columns = 2,
  className,
}: RoleSelectorProps) {
  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  };

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      {description ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      ) : null}

      <div
        className={cn(
          "mt-3 grid gap-2",
          columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {roles.map((role) => {
          const checked = value.includes(role.id);
          return (
            <label
              key={role.id}
              className={cn(
                "relative flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring",
                checked
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/60 bg-background/40 hover:border-border",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => toggle(role.id)}
              />
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
                )}
                aria-hidden
              >
                {checked ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {role.name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {role.personality.summary}
                </span>
                <RiskBadge
                  level={role.riskLevel}
                  showLabel={false}
                  className="mt-1.5"
                />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
