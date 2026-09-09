import type { ReportRecord } from "./types";

export const recentReports: ReportRecord[] = [
  {
    id: "r1",
    title: "Daily Market Report",
    status: "ready",
    createdLabel: "Today",
  },
  {
    id: "r2",
    title: "Sector Rotation Brief",
    status: "processing",
    createdLabel: "Today",
  },
  {
    id: "r3",
    title: "Weekly Portfolio Digest",
    status: "ready",
    createdLabel: "Yesterday",
  },
  {
    id: "r4",
    title: "Fed Statement Reaction",
    status: "queued",
    createdLabel: "Yesterday",
  },
];

/* ---------------------------------------------------------------------------
 * Daily market report — generation pipeline (CLAUDE.md).
 * Frontend preview only: no Grok / ElevenLabs / HeyGen / FFmpeg / S3.
 * ------------------------------------------------------------------------- */

export type ReportGenerationStatus =
  | "QUEUED"
  | "RESEARCHING"
  | "SCRIPTING"
  | "AWAITING_APPROVAL"
  | "GENERATING_AUDIO"
  | "GENERATING_VIDEO"
  | "PROCESSING_VIDEO"
  | "UPLOADING"
  | "READY"
  | "FAILED";

export type PipelineStageId =
  | "research"
  | "script"
  | "approval"
  | "voice"
  | "avatar"
  | "processing"
  | "storage";

export interface PipelineStage {
  id: PipelineStageId;
  label: string;
  description: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "research",
    label: "Market Research",
    description: "Grok gathers and summarizes the day's market context.",
  },
  {
    id: "script",
    label: "Script Generation",
    description: "Grok drafts the narration script from the research brief.",
  },
  {
    id: "approval",
    label: "Approval",
    description: "An operator reviews and approves the script before generation.",
  },
  {
    id: "voice",
    label: "Voice Generation",
    description: "ElevenLabs narrates with the Professional Voice Clone.",
  },
  {
    id: "avatar",
    label: "Avatar Video",
    description: "HeyGen renders the talking-head avatar.",
  },
  {
    id: "processing",
    label: "FFmpeg Processing",
    description: "Compose 16:9 and 9:16 cuts and burn in captions.",
  },
  {
    id: "storage",
    label: "Storage",
    description: "Upload the final assets to S3.",
  },
];

export type StageState = "done" | "active" | "pending" | "failed";

const STAGE_ORDER: PipelineStageId[] = [
  "research",
  "script",
  "approval",
  "voice",
  "avatar",
  "processing",
  "storage",
];

const STATUS_ACTIVE_INDEX: Record<ReportGenerationStatus, number> = {
  QUEUED: -1,
  RESEARCHING: 0,
  SCRIPTING: 1,
  AWAITING_APPROVAL: 2,
  GENERATING_AUDIO: 3,
  GENERATING_VIDEO: 4,
  PROCESSING_VIDEO: 5,
  UPLOADING: 6,
  READY: 99,
  FAILED: -1,
};

export function pipelineStageStates(
  report: Pick<ReportEntry, "status" | "failedStage">,
): Record<PipelineStageId, StageState> {
  const result = {} as Record<PipelineStageId, StageState>;

  if (report.status === "FAILED") {
    const failIndex = report.failedStage
      ? STAGE_ORDER.indexOf(report.failedStage)
      : 0;
    STAGE_ORDER.forEach((stage, index) => {
      result[stage] =
        index < failIndex ? "done" : index === failIndex ? "failed" : "pending";
    });
    return result;
  }

  const activeIndex = STATUS_ACTIVE_INDEX[report.status];
  STAGE_ORDER.forEach((stage, index) => {
    result[stage] =
      activeIndex === 99 || index < activeIndex
        ? "done"
        : index === activeIndex
          ? "active"
          : "pending";
  });
  return result;
}

export type ReportAssetType =
  | "brief"
  | "script"
  | "audio"
  | "video_16_9"
  | "video_9_16"
  | "captions";

export type ReportAssetStatus = "available" | "pending" | "failed";

export interface ReportAsset {
  id: string;
  type: ReportAssetType;
  label: string;
  filename: string;
  sizeLabel: string;
  status: ReportAssetStatus;
  storageKey?: string;
}

export interface ReportScript {
  brief: string;
  script: string;
  wordCount: number;
  estimatedMinutes: number;
}

export interface ReportEntry {
  id: string;
  title: string;
  dateLabel: string;
  createdAtLabel: string;
  status: ReportGenerationStatus;
  failedStage?: PipelineStageId;
  failureReason?: string;
  model: string;
  targetMinutes: number;
  actualMinutes?: number;
  estimatedCost: string;
  script?: ReportScript;
  assets: ReportAsset[];
}

const ASSET_TEMPLATE: {
  type: ReportAssetType;
  label: string;
  filename: string;
  stage: PipelineStageId;
  size: string;
}[] = [
  { type: "brief", label: "Research brief", filename: "research-brief.md", stage: "research", size: "12 KB" },
  { type: "script", label: "Final script", filename: "script.txt", stage: "script", size: "9 KB" },
  { type: "audio", label: "Narration audio", filename: "narration.mp3", stage: "voice", size: "9.6 MB" },
  { type: "video_16_9", label: "Video · 16:9", filename: "report-16x9.mp4", stage: "processing", size: "184 MB" },
  { type: "video_9_16", label: "Video · 9:16", filename: "report-9x16.mp4", stage: "processing", size: "141 MB" },
  { type: "captions", label: "Captions", filename: "captions.srt", stage: "processing", size: "6 KB" },
];

function assetsFor(
  reportId: string,
  stages: Record<PipelineStageId, StageState>,
): ReportAsset[] {
  return ASSET_TEMPLATE.map((template, index) => {
    const stageState = stages[template.stage] ?? "pending";
    const status: ReportAssetStatus =
      stageState === "done"
        ? "available"
        : stageState === "failed"
          ? "failed"
          : "pending";
    return {
      id: `${reportId}-a${index}`,
      type: template.type,
      label: template.label,
      filename: template.filename,
      sizeLabel: status === "available" ? template.size : "—",
      status,
      storageKey:
        status === "available"
          ? `s3://dtcc-media/reports/${reportId}/${template.filename}`
          : undefined,
    };
  });
}

const SAMPLE_BRIEF = `Overnight: Asian equities closed higher; US futures +0.4% pre-open.
Rates: 10Y little changed at 4.18% ahead of this afternoon's data.
Movers: semiconductors leading on stronger guidance; energy soft on inventory build.
Watch: Fed meeting Thursday — market pricing a hold with a hawkish risk.`;

const SAMPLE_SCRIPT = `Good morning. Here is your market briefing for the session ahead.

Global equities are firmer. Asian markets closed higher overnight and US index futures are pointing to a modest gain at the open, led by the technology sector after another round of upbeat guidance from the semiconductor names.

Rates are quiet. The ten-year yield is holding near four-point-one-eight percent as traders wait for this afternoon's data. That calm is unlikely to last past Thursday, when the Federal Reserve meets. The market is priced for a hold, but the risk is a more hawkish tone than expected.

In commodities, energy is on the back foot after a larger-than-expected inventory build.

Bottom line: a constructive open, with event risk concentrated later in the week.`;

function buildReport(
  base: Omit<ReportEntry, "assets">,
): ReportEntry {
  const stages = pipelineStageStates(base);
  return { ...base, assets: assetsFor(base.id, stages) };
}

export const reports: ReportEntry[] = [
  buildReport({
    id: "rep-2024-03-05",
    title: "Daily Market Report",
    dateLabel: "Mar 5, 2024",
    createdAtLabel: "Today, 06:00",
    status: "READY",
    model: "grok-2",
    targetMinutes: 10,
    actualMinutes: 10.4,
    estimatedCost: "$4.20",
    script: {
      brief: SAMPLE_BRIEF,
      script: SAMPLE_SCRIPT,
      wordCount: 168,
      estimatedMinutes: 10.4,
    },
  }),
  buildReport({
    id: "rep-2024-03-04",
    title: "Daily Market Report",
    dateLabel: "Mar 4, 2024",
    createdAtLabel: "Yesterday, 06:00",
    status: "READY",
    model: "grok-2",
    targetMinutes: 10,
    actualMinutes: 9.8,
    estimatedCost: "$4.05",
    script: {
      brief: SAMPLE_BRIEF,
      script: SAMPLE_SCRIPT,
      wordCount: 161,
      estimatedMinutes: 9.8,
    },
  }),
  buildReport({
    id: "rep-sector-rotation",
    title: "Sector Rotation Special",
    dateLabel: "Mar 5, 2024",
    createdAtLabel: "Today, 07:15",
    status: "AWAITING_APPROVAL",
    model: "grok-2",
    targetMinutes: 8,
    estimatedCost: "$3.10 (est.)",
    script: {
      brief: SAMPLE_BRIEF,
      script: SAMPLE_SCRIPT,
      wordCount: 154,
      estimatedMinutes: 8.2,
    },
  }),
  buildReport({
    id: "rep-fed-reaction",
    title: "Fed Statement Reaction",
    dateLabel: "Mar 5, 2024",
    createdAtLabel: "Today, 11:40",
    status: "GENERATING_VIDEO",
    model: "grok-2",
    targetMinutes: 6,
    estimatedCost: "$2.80 (est.)",
    script: {
      brief: SAMPLE_BRIEF,
      script: SAMPLE_SCRIPT,
      wordCount: 132,
      estimatedMinutes: 6.1,
    },
  }),
  buildReport({
    id: "rep-portfolio-digest",
    title: "Weekly Portfolio Digest",
    dateLabel: "Mar 5, 2024",
    createdAtLabel: "Today, 12:02",
    status: "RESEARCHING",
    model: "grok-2",
    targetMinutes: 11,
    estimatedCost: "$4.60 (est.)",
  }),
  buildReport({
    id: "rep-earnings-preview",
    title: "Earnings Season Preview",
    dateLabel: "Mar 4, 2024",
    createdAtLabel: "Yesterday, 16:20",
    status: "FAILED",
    failedStage: "avatar",
    failureReason: "HeyGen render timed out after 3 retries.",
    model: "grok-2",
    targetMinutes: 9,
    estimatedCost: "$3.90",
    script: {
      brief: SAMPLE_BRIEF,
      script: SAMPLE_SCRIPT,
      wordCount: 149,
      estimatedMinutes: 9.1,
    },
  }),
];

export function getReport(id: string): ReportEntry | undefined {
  return reports.find((report) => report.id === id);
}

/** Return a copy of the report at a new status, with assets recomputed. */
export function reportWithStatus(
  report: ReportEntry,
  status: ReportGenerationStatus,
): ReportEntry {
  const stages = pipelineStageStates({ status, failedStage: report.failedStage });
  return { ...report, status, assets: assetsFor(report.id, stages) };
}

/** A fresh queued report for the "Generate report" action. */
export function draftReport(): ReportEntry {
  const id = `rep-draft-${Date.now()}`;
  return buildReport({
    id,
    title: "Daily Market Report",
    dateLabel: "Today",
    createdAtLabel: "Just now",
    status: "QUEUED",
    model: "grok-2",
    targetMinutes: 10,
    estimatedCost: "—",
  });
}
