import {
  FileBarChart,
  PhoneCall,
  Radio,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { recentActivity } from "@/lib/mock-data/activity";
import type { ActivityEntry, ActivityKind } from "@/lib/mock-data/types";

import { DashboardCard } from "./dashboard-card";

const KIND_ICON: Record<ActivityKind, LucideIcon> = {
  call: PhoneCall,
  report: FileBarChart,
  role: Users,
  system: Sparkles,
  voice: Radio,
};

export function ActivityFeed({
  items = recentActivity,
  className,
}: {
  items?: ActivityEntry[];
  className?: string;
}) {
  return (
    <DashboardCard
      className={className}
      title="Recent activity"
      description="Latest Twin events"
    >
      <ol className="relative space-y-5 before:absolute before:left-[0.5625rem] before:top-1 before:h-[calc(100%-1rem)] before:w-px before:bg-border/70">
        {items.map((entry) => {
          const Icon = KIND_ICON[entry.kind];
          return (
            <li key={entry.id} className="relative flex gap-3.5">
              <span className="relative z-10 flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center rounded-full border border-border/70 bg-card">
                <Icon className="h-3 w-3 text-primary" aria-hidden />
              </span>
              <div className="-mt-0.5 min-w-0">
                <p className="text-sm text-foreground">{entry.title}</p>
                <p className="text-xs text-muted-foreground">{entry.time}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </DashboardCard>
  );
}
