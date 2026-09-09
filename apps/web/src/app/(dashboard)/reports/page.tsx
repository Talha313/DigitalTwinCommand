import type { Metadata } from "next";

import { ReportDashboard } from "@/components/reports/report-dashboard";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <ReportDashboard />;
}
