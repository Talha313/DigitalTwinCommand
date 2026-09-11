import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { ReportDetail } from "@/components/reports/report-detail";

export const metadata: Metadata = { title: "Report" };

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer>
      <ReportDetail reportId={id} />
    </PageContainer>
  );
}
