import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Plug,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = { title: "Settings" };

interface SettingsSection {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  ready: boolean;
}

const SECTIONS: SettingsSection[] = [
  {
    title: "Integrations",
    description: "Twilio, ElevenLabs, xAI, HeyGen, and media storage.",
    href: "/settings/integrations",
    icon: Plug,
    ready: true,
  },
  {
    title: "Team",
    description: "Operators and access.",
    href: "/settings/team",
    icon: Users,
    ready: true,
  },
  {
    title: "Notifications",
    description: "Alerts and delivery channels.",
    href: "/settings",
    icon: Bell,
    ready: false,
  },
  {
    title: "Billing",
    description: "Usage and plan.",
    href: "/settings",
    icon: CreditCard,
    ready: false,
  },
];

export default function SettingsPage() {
  return (
    <PageContainer>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure the command center.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const body = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {section.title}
                  {!section.ready ? (
                    <span className="rounded border border-border/60 bg-background/40 px-1 py-0.5 text-[10px] font-normal text-muted-foreground">
                      Soon
                    </span>
                  ) : null}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {section.description}
                </span>
              </span>
              {section.ready ? (
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              ) : null}
            </>
          );

          return section.ready ? (
            <Link
              key={section.title}
              href={section.href}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40"
            >
              {body}
            </Link>
          ) : (
            <div
              key={section.title}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 opacity-60",
              )}
            >
              {body}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
