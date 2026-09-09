import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { recentCalls } from "@/lib/mock-data/calls";
import type { CallRecord, CallStatus } from "@/lib/mock-data/types";

import { DashboardCard } from "./dashboard-card";

type CallBadgeVariant = "success" | "warning" | "danger" | "muted";

const STATUS_META: Record<
  CallStatus,
  { label: string; variant: CallBadgeVariant }
> = {
  completed: { label: "Completed", variant: "success" },
  "in-progress": { label: "In progress", variant: "warning" },
  missed: { label: "Missed", variant: "muted" },
  failed: { label: "Failed", variant: "danger" },
};

export function RecentCalls({
  calls = recentCalls,
  className,
}: {
  calls?: CallRecord[];
  className?: string;
}) {
  return (
    <DashboardCard
      className={className}
      title="Recent calls"
      description="Last handled conversations"
      contentClassName="p-0"
      action={
        <Link
          href="/calls/history"
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          View all
        </Link>
      }
    >
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-5 py-3 font-medium">
              Caller
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Role
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Duration
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {calls.map((call) => {
            const meta = STATUS_META[call.status];
            return (
              <tr key={call.id} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-3 font-medium text-foreground">
                  {call.caller}
                </td>
                <td className="px-5 py-3 text-muted-foreground">{call.role}</td>
                <td className="px-5 py-3 tabular-nums text-muted-foreground">
                  {call.duration}
                </td>
                <td className="px-5 py-3">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{call.date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-border/50 md:hidden">
        {calls.map((call) => {
          const meta = STATUS_META[call.status];
          return (
            <li
              key={call.id}
              className="flex items-center justify-between gap-3 px-5 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {call.caller}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {call.role} &middot; {call.duration} &middot; {call.date}
                </p>
              </div>
              <Badge variant={meta.variant}>{meta.label}</Badge>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
