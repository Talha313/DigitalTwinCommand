"use client";

import Link from "next/link";
import {
  Landmark,
  Lock,
  Megaphone,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import type { Role } from "@/lib/mock-data/types";

import { RiskBadge } from "./risk-badge";

const ROLE_ICON: Record<string, LucideIcon> = {
  financial: Landmark,
  operator: Workflow,
  public: Megaphone,
  private: Lock,
};

const MAX_CHIPS = 4;

function Chips({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  const shown = items.slice(0, MAX_CHIPS);
  const extra = items.length - shown.length;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label} · {items.length}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {shown.map((item) => (
          <span
            key={item}
            className="rounded-md border border-border/60 bg-background/40 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            {item}
          </span>
        ))}
        {extra > 0 ? (
          <span className="rounded-md border border-border/60 bg-background/40 px-1.5 py-0.5 text-[11px] text-muted-foreground">
            +{extra}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export interface RoleCardProps {
  role: Role;
  selected?: boolean;
  onViewDetails: () => void;
  className?: string;
}

export function RoleCard({
  role,
  selected = false,
  onViewDetails,
  className,
}: RoleCardProps) {
  const Icon = ROLE_ICON[role.id] ?? Landmark;

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border bg-card shadow-sm transition-colors",
        selected ? "border-primary/50" : "border-border/60",
        className,
      )}
    >
      <div className="border-b border-border/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                {role.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {role.personality.tone}
              </p>
            </div>
          </div>
          <RiskBadge level={role.riskLevel} className="shrink-0" />
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {role.description}
        </p>
      </div>

      <div className="flex-1 space-y-4 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Personality
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {role.personality.traits.map((trait) => (
              <span
                key={trait}
                className="rounded-md border border-border/60 bg-background/40 px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        <Chips label="Tools" items={role.tools.map((tool) => tool.id)} />
        <Chips
          label="Permissions"
          items={role.permissions.map((permission) => permission.id)}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border/60 p-4">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusDot tone={role.active ? "positive" : "neutral"} />
          {role.active ? "Active" : "Inactive"}
        </span>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/roles/${role.id}`}>Configure</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            View details
          </Button>
        </div>
      </div>
    </article>
  );
}
