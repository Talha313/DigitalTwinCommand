"use client";

import type { ReactNode } from "react";
import {
  KeyRound,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { RiskLevel, RoleRead } from "@/lib/roles";

import { PermissionList } from "./permission-list";
import { RiskBadge } from "./risk-badge";
import { RoleSettings } from "./role-settings";
import { ToolAccess } from "./tool-access";

const RISK_NOTE: Record<RiskLevel, string> = {
  low: "Read-only and summarization actions. No approval required.",
  medium:
    "Can take reversible actions such as messaging, task creation, and workflow runs.",
  high: "Can trigger financial or public actions. Every high-risk tool call requires operator approval.",
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
        {title}
      </h3>
      {children}
    </section>
  );
}

export interface RoleDetailsProps {
  role: RoleRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleDetails({ role, open, onOpenChange }: RoleDetailsProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-none gap-0 p-0 sm:max-w-lg"
        aria-describedby={undefined}
      >
        {role ? (
          <>
            <SheetHeader className="border-b border-border/60 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-500">
                  <Sparkles
                    className="h-4 w-4 text-primary-foreground"
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <SheetTitle>{role.name}</SheetTitle>
                </div>
                <RiskBadge
                  level={role.risk_level}
                  className="ml-auto shrink-0"
                />
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <Section icon={Sparkles} title="Personality">
                {role.personality?.summary ? (
                  <p className="text-sm text-foreground">
                    {role.personality.summary}
                  </p>
                ) : null}
                {role.personality?.traits && role.personality.traits.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {role.personality.traits.map((trait) => (
                      <span
                        key={trait}
                        className="rounded-md border border-border/60 bg-background/40 px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                ) : null}
                {role.tone ? (
                  <div className="mt-3 flex gap-2 text-sm">
                    <span className="w-16 shrink-0 text-muted-foreground">
                      Tone
                    </span>
                    <span className="text-foreground">{role.tone}</span>
                  </div>
                ) : null}
                {role.personality?.systemPromptPreview ? (
                  <div className="mt-3 rounded-lg border border-border/50 bg-background/40 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      System prompt preview
                    </p>
                    <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                      {role.personality.systemPromptPreview}
                    </p>
                  </div>
                ) : null}
              </Section>

              <Section icon={ShieldCheck} title="Risk level">
                <RiskBadge level={role.risk_level} />
                <p className="mt-2 text-sm text-muted-foreground">
                  {RISK_NOTE[role.risk_level]}
                </p>
              </Section>

              <Section
                icon={Wrench}
                title={`Tool access · ${role.tools.length}`}
              >
                <ToolAccess tools={role.tools} />
              </Section>

              <Section
                icon={KeyRound}
                title={`Permissions · ${role.permissions.length}`}
              >
                <PermissionList permissions={role.permissions} />
              </Section>

              <Section icon={SlidersHorizontal} title="Role settings">
                <RoleSettings role={role} />
              </Section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
