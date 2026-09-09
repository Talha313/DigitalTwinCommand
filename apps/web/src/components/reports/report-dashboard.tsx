"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  draftReport,
  reports as baseReports,
  reportWithStatus,
  type ReportEntry,
} from "@/lib/mock-data/reports";

import { AssetList } from "./asset-list";
import { PipelineProgress } from "./pipeline-progress";
import { ReportCard } from "./report-card";
import {
  matchesBucket,
  ReportFilters,
  type ReportFilterBucket,
} from "./report-filters";
import { ReportStatus } from "./report-status";
import { ScriptPreview } from "./script-preview";
import { VideoPreview } from "./video-preview";

const BUCKETS: ReportFilterBucket[] = [
  "all",
  "ready",
  "in_progress",
  "awaiting_approval",
  "failed",
];

type DetailTab = "pipeline" | "script" | "video" | "assets";

function ReportDetailPanel({
  report,
  onApprove,
}: {
  report: ReportEntry;
  onApprove: () => void;
}) {
  const [tab, setTab] = React.useState<DetailTab>("pipeline");

  React.useEffect(() => {
    setTab("pipeline");
  }, [report.id]);

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "pipeline", label: "Pipeline" },
    { id: "script", label: "Script" },
    { id: "video", label: "Video" },
    { id: "assets", label: `Assets (${report.assets.length})` },
  ];

  return (
    <>
      <SheetHeader className="border-b border-border/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <SheetTitle>{report.title}</SheetTitle>
            <p className="text-xs text-muted-foreground">
              {report.dateLabel} · {report.createdAtLabel} · {report.model}
            </p>
          </div>
          <ReportStatus status={report.status} className="ml-auto shrink-0" />
        </div>
        {report.status === "AWAITING_APPROVAL" ? (
          <Button size="sm" className="mt-2 w-fit" onClick={onApprove}>
            Approve script
          </Button>
        ) : null}
        <div
          role="tablist"
          aria-label="Report sections"
          className="mt-3 flex flex-wrap gap-1"
        >
          {tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              onClick={() => setTab(entry.id)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                tab === entry.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {tab === "pipeline" ? <PipelineProgress report={report} /> : null}
        {tab === "script" ? <ScriptPreview script={report.script} /> : null}
        {tab === "video" ? <VideoPreview assets={report.assets} /> : null}
        {tab === "assets" ? <AssetList assets={report.assets} /> : null}
      </div>
    </>
  );
}

export function ReportDashboard() {
  const [list, setList] = React.useState<ReportEntry[]>(baseReports);
  const [filter, setFilter] = React.useState<ReportFilterBucket>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const counts = BUCKETS.reduce(
    (acc, bucket) => {
      acc[bucket] = list.filter((report) =>
        matchesBucket(report.status, bucket),
      ).length;
      return acc;
    },
    {} as Record<ReportFilterBucket, number>,
  );

  const visible = list.filter((report) =>
    matchesBucket(report.status, filter),
  );
  const selected = list.find((report) => report.id === selectedId) ?? null;

  const approve = (id: string) => {
    setList((current) =>
      current.map((report) =>
        report.id === id && report.status === "AWAITING_APPROVAL"
          ? reportWithStatus(report, "GENERATING_AUDIO")
          : report,
      ),
    );
  };

  const generate = () => {
    const draft = draftReport();
    setList((current) => [draft, ...current]);
    setFilter("all");
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
        <Button size="sm" onClick={generate} className="shrink-0 gap-2">
          <Sparkles className="h-4 w-4" aria-hidden />
          Generate report
        </Button>
      </div>

      <ReportFilters value={filter} onChange={setFilter} counts={counts} />

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No reports match this filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onReview={() => setSelectedId(report.id)}
              onApprove={() => approve(report.id)}
            />
          ))}
        </div>
      )}

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full max-w-none gap-0 p-0 sm:max-w-2xl"
          aria-describedby={undefined}
        >
          {selected ? (
            <ReportDetailPanel
              report={selected}
              onApprove={() => approve(selected.id)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
