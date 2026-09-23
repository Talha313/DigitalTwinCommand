"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { PageContainer } from "@/components/layout/page-container";
import { ApiError } from "@/lib/api-client";
import {
  approveReport,
  generateReport,
  listReports,
  type ReportListItem,
} from "@/lib/reports";

import { ReportCard } from "./report-card";
import {
  matchesBucket,
  ReportFilters,
  type ReportFilterBucket,
} from "./report-filters";

const PAGE_SIZE = 9;

const BUCKETS: ReportFilterBucket[] = [
  "all",
  "ready",
  "in_progress",
  "awaiting_approval",
  "failed",
];

export function ReportDashboard() {
  const [list, setList] = React.useState<ReportListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<ReportFilterBucket>("all");
  const [generating, setGenerating] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const refresh = React.useCallback(async () => {
    try {
      const data = await listReports();
      setList(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const counts = BUCKETS.reduce(
    (acc, bucket) => {
      acc[bucket] = list.filter((report) => matchesBucket(report.status, bucket)).length;
      return acc;
    },
    {} as Record<ReportFilterBucket, number>,
  );

  const visible = list.filter((report) => matchesBucket(report.status, filter));
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [filter]);

  const approve = async (id: string) => {
    try {
      await approveReport(id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to approve report.");
    }
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await generateReport();
      setFilter("all");
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to start report generation.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            AI Reports &amp; Video Pipeline
          </h2>
          <p className="text-sm text-muted-foreground">
            Daily market reports from research through voice, avatar, and video
            processing to storage.
          </p>
        </div>
        <Button
          size="sm"
          onClick={generate}
          disabled={generating}
          className="shrink-0 gap-2"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {generating ? "Starting…" : "Generate report"}
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ReportFilters value={filter} onChange={setFilter} counts={counts} />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reports…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No reports match this filter.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paged.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onApprove={() => approve(report.id)}
              />
            ))}
          </div>
          <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}
    </PageContainer>
  );
}
