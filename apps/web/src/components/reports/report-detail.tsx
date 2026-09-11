"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import {
  approveReport,
  getReport,
  getReportJobs,
  submitAvatar,
  type ReportJobRead,
  type ReportRead,
} from "@/lib/reports";

import { AssetList } from "./asset-list";
import { PipelineProgress } from "./pipeline-progress";
import { ReportStatus } from "./report-status";
import { ScriptPreview } from "./script-preview";
import { VideoPreview } from "./video-preview";

type DetailTab = "pipeline" | "script" | "video" | "assets";

const TABS: { id: DetailTab; label: string }[] = [
  { id: "pipeline", label: "Pipeline" },
  { id: "script", label: "Script" },
  { id: "video", label: "Video" },
  { id: "assets", label: "Assets" },
];

export function ReportDetail({ reportId }: { reportId: string }) {
  const [report, setReport] = React.useState<ReportRead | null>(null);
  const [jobs, setJobs] = React.useState<ReportJobRead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<DetailTab>("pipeline");
  const [busy, setBusy] = React.useState(false);
  const [video16x9Url, setVideo16x9Url] = React.useState("");
  const [video9x16Url, setVideo9x16Url] = React.useState("");

  const refresh = React.useCallback(async () => {
    try {
      const [r, j] = await Promise.all([getReport(reportId), getReportJobs(reportId)]);
      setReport(r);
      setJobs(j);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load this report.");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      await approveReport(reportId);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to approve report.");
    } finally {
      setBusy(false);
    }
  };

  const submitVideo = async () => {
    if (!video16x9Url.trim() && !video9x16Url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await submitAvatar(reportId, {
        video_16x9_url: video16x9Url.trim() || undefined,
        video_9x16_url: video9x16Url.trim() || undefined,
      });
      setVideo16x9Url("");
      setVideo9x16Url("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit avatar video.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading report…</p>;
  }

  if (!report) {
    return (
      <div className="flex flex-col gap-3">
        <Link
          href="/reports"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to reports
        </Link>
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error ?? "Report not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/reports"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to reports
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {report.date ? `Daily report — ${report.date}` : "Daily report"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Created {new Date(report.created_at).toLocaleString()}
            {report.model ? ` · ${report.model}` : ""}
          </p>
        </div>
        <ReportStatus status={report.status} />
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {report.status === "failed" && report.error_message ? (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-300">
          {report.error_message}
        </p>
      ) : null}

      {report.status === "script_ready" ? (
        <Button size="sm" className="w-fit" onClick={approve} disabled={busy}>
          Approve script
        </Button>
      ) : null}

      {report.status === "awaiting_avatar" ? (
        <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-medium text-foreground">
            Submit the rendered avatar
          </p>
          <p className="text-xs text-muted-foreground">
            Render this report&apos;s script in ElevenCreative, then paste the
            hosted video URL(s) here.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="video-16x9">16:9 video URL</Label>
              <Input
                id="video-16x9"
                value={video16x9Url}
                onChange={(e) => setVideo16x9Url(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="video-9x16">9:16 video URL</Label>
              <Input
                id="video-9x16"
                value={video9x16Url}
                onChange={(e) => setVideo9x16Url(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={submitVideo}
            disabled={busy || (!video16x9Url.trim() && !video9x16Url.trim())}
          >
            Submit
          </Button>
        </div>
      ) : null}

      <div role="tablist" aria-label="Report sections" className="flex flex-wrap gap-1">
        {TABS.map((entry) => (
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

      <div className="rounded-xl border border-border/60 bg-card p-4">
        {tab === "pipeline" ? <PipelineProgress jobs={jobs} /> : null}
        {tab === "script" ? (
          <ScriptPreview script={report.script} briefJson={report.brief_json} />
        ) : null}
        {tab === "video" ? (
          <VideoPreview video16x9={report.video_16x9} video9x16={report.video_9x16} />
        ) : null}
        {tab === "assets" ? <AssetList report={report} /> : null}
      </div>
    </div>
  );
}
