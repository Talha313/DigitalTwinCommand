import Link from "next/link";
import {
  MessagesSquare,
  PhoneCall,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { DashboardCard } from "./dashboard-card";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const ACTIONS: QuickAction[] = [
  {
    label: "Start Chat",
    description: "Open a new conversation with the Twin",
    href: "/chat",
    icon: MessagesSquare,
  },
  {
    label: "Start Voice Call",
    description: "Place an outbound AI call",
    href: "/calls/live",
    icon: PhoneCall,
  },
  {
    label: "Generate Report",
    description: "Queue a market briefing",
    href: "/reports",
    icon: SlidersHorizontal,
  },
  {
    label: "Manage Roles",
    description: "Adjust the active Twin roles",
    href: "/roles",
    icon: Users,
  },
];

export function QuickActions({ className }: { className?: string }) {
  return (
    <DashboardCard
      className={className}
      title="Quick actions"
      description="Jump into a Twin operation"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "group flex flex-col gap-3 rounded-lg border border-border/60 bg-background/40 p-4 transition-colors",
              "hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-card text-primary transition-colors group-hover:border-primary/40">
              <action.icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">
                {action.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {action.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}
