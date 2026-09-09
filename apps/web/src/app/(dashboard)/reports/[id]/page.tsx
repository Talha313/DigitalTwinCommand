import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Report" };

export default function ReportDetailPage() {
  return (
    <ModulePlaceholder
      title="Report detail"
      description="The full report view is coming in a later milestone."
    />
  );
}
