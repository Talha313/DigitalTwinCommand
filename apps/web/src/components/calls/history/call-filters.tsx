"use client";

import { Check, SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRolesContext } from "@/lib/role-context";
import { shortName } from "@/lib/roles";
import type { CallDirection } from "@/lib/mock-data/types";
import type { UiCallStatus } from "@/lib/call-history";

export type DirectionFilter = "all" | CallDirection;

const STATUS_OPTIONS: { id: UiCallStatus; label: string }[] = [
  { id: "completed", label: "Completed" },
  { id: "in-progress", label: "In progress" },
  { id: "missed", label: "Missed" },
  { id: "failed", label: "Failed" },
];

const DIRECTION_OPTIONS: { id: DirectionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "inbound", label: "Inbound" },
  { id: "outbound", label: "Outbound" },
];

export interface CallFiltersProps {
  status: UiCallStatus[];
  roleIds: string[];
  direction: DirectionFilter;
  onStatusChange: (status: UiCallStatus[]) => void;
  onRoleIdsChange: (roleIds: string[]) => void;
  onDirectionChange: (direction: DirectionFilter) => void;
  onClear: () => void;
}

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-foreground hover:bg-accent">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onToggle}
      />
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border",
        )}
        aria-hidden
      >
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
      {label}
    </label>
  );
}

export function CallFilters({
  status,
  roleIds,
  direction,
  onStatusChange,
  onRoleIdsChange,
  onDirectionChange,
  onClear,
}: CallFiltersProps) {
  const { roles: allRoles } = useRolesContext();
  const activeCount =
    status.length + roleIds.length + (direction !== "all" ? 1 : 0);

  const toggleStatus = (value: UiCallStatus) =>
    onStatusChange(
      status.includes(value)
        ? status.filter((s) => s !== value)
        : [...status, value],
    );

  const toggleRole = (value: string) =>
    onRoleIdsChange(
      roleIds.includes(value)
        ? roleIds.filter((r) => r !== value)
        : [...roleIds, value],
    );

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-fit gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Filters
            {activeCount > 0 ? (
              <Badge variant="default" className="px-1.5">
                {activeCount}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-64 max-w-[calc(100vw-2rem)] space-y-4"
        >
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Direction
            </p>
            <div className="flex gap-1">
              {DIRECTION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={direction === option.id}
                  onClick={() => onDirectionChange(option.id)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                    direction === option.id
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            {STATUS_OPTIONS.map((option) => (
              <CheckRow
                key={option.id}
                label={option.label}
                checked={status.includes(option.id)}
                onToggle={() => toggleStatus(option.id)}
              />
            ))}
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              AI role
            </p>
            {allRoles.map((role) => (
              <CheckRow
                key={role.id}
                label={role.name}
                checked={roleIds.includes(role.id)}
                onToggle={() => toggleRole(role.id)}
              />
            ))}
          </div>

          {activeCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="w-full text-xs text-muted-foreground"
            >
              Clear all filters
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>

      {activeCount > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {direction !== "all" ? (
            <FilterChip
              label={direction === "inbound" ? "Inbound" : "Outbound"}
              onRemove={() => onDirectionChange("all")}
            />
          ) : null}
          {status.map((value) => (
            <FilterChip
              key={value}
              label={STATUS_OPTIONS.find((o) => o.id === value)?.label ?? value}
              onRemove={() => toggleStatus(value)}
            />
          ))}
          {roleIds.map((value) => {
            const role = allRoles.find((r) => r.id === value);
            return (
              <FilterChip
                key={value}
                label={role ? shortName(role.name) : value}
                onRemove={() => toggleRole(value)}
              />
            );
          })}
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/40 py-0.5 pl-2 pr-1 text-xs text-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </span>
  );
}

export { STATUS_OPTIONS };
