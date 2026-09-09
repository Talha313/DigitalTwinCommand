import type { Metadata } from "next";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentCalls } from "@/components/dashboard/recent-calls";
import { RecentReports } from "@/components/dashboard/recent-reports";
import { SystemOverview } from "@/components/dashboard/system-overview";
import { TwinStatusCard } from "@/components/dashboard/twin-status-card";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <PageContainer>
      <SystemOverview />

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-3">
        <TwinStatusCard className="xl:col-span-2" />
        <QuickActions className="xl:col-span-1" />
      </div>

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <RecentReports />
      </div>

      <RecentCalls />
    </PageContainer>
  );
}
