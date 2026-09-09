import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

const METRIC_KEYS = ["m1", "m2", "m3", "m4"];

export default function DashboardLoading() {
  return (
    <PageContainer>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {METRIC_KEYS.map((key) => (
          <Skeleton key={key} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-xl xl:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </PageContainer>
  );
}
