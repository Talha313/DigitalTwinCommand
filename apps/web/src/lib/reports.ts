/**
 * Reports (daily market report pipeline) API calls.
 * Types mirror backend/app/models/reports.py and
 * backend/app/db/models/enums.py (ReportStatus, ReportStage, ReportJobStatus).
 */
import { apiFetch } from "./api-client";

/** The real 8-value report lifecycle. `failed` can happen from any stage —
 * check `error_message` for why. */
export type ReportStatus =
  | "queued"
  | "researching"
  | "script_ready"
  | "approved"
  | "generating"
  | "awaiting_avatar"
  | "ready"
  | "failed";

/** Background-job pipeline stages (what `GET /reports/{id}/jobs` tracks).
 * Note "approval" is not a job stage — it's a synchronous operator action
 * that flips status from script_ready -> approved. */
export type ReportStage =
  | "research"
  | "script"
  | "voice"
  | "avatar"
  | "processing"
  | "upload";

export type ReportJobStatus = "pending" | "running" | "completed" | "failed";

export interface ReportListItem {
  id: string;
  date: string | null;
  status: ReportStatus;
  model: string | null;
  cost_cents: number | null;
  created_at: string;
}

export interface ReportRead {
  id: string;
  date: string | null;
  status: ReportStatus;
  brief_json: Record<string, unknown> | null;
  script: string | null;
  tool_traces: Record<string, unknown> | null;
  error_message: string | null;
  audio_url: string | null;
  video_16x9: string | null;
  video_9x16: string | null;
  captions_url: string | null;
  model: string | null;
  cost_cents: number | null;
  approved_at: string | null;
  created_at: string;
}

export interface ReportApproveResponse {
  id: string;
  status: ReportStatus;
}

export interface ReportJobRead {
  id: string;
  report_id: string;
  stage: ReportStage;
  status: ReportJobStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

/** Hand back the ElevenCreative avatar render(s) for a report parked at
 * `awaiting_avatar` — either as uploaded MP4 files or hosted URLs (or a mix).
 * At least one of the four fields must be set. */
export interface AvatarSubmitInput {
  file_16x9?: File;
  file_9x16?: File;
  video_16x9_url?: string;
  video_9x16_url?: string;
}

export function listReports(): Promise<ReportListItem[]> {
  return apiFetch<ReportListItem[]>("/api/reports");
}

export function getReport(reportId: string): Promise<ReportRead> {
  return apiFetch<ReportRead>(`/api/reports/${reportId}`);
}

/** Kick off today's report. Idempotent per calendar date — 409s if today's
 * report already exists unless `force` is true (which resets it to queued). */
export function generateReport(force = false): Promise<ReportRead> {
  return apiFetch<ReportRead>(`/api/reports/generate?force=${force}`, {
    method: "POST",
  });
}

/** Only legal when status is `script_ready`. */
export function approveReport(reportId: string): Promise<ReportApproveResponse> {
  return apiFetch<ReportApproveResponse>(`/api/reports/${reportId}/approve`, {
    method: "POST",
  });
}

/** Only legal when status is `awaiting_avatar`, `generating`, or `ready`. */
export function submitAvatar(
  reportId: string,
  input: AvatarSubmitInput,
): Promise<ReportRead> {
  const formData = new FormData();
  if (input.file_16x9) formData.append("file_16x9", input.file_16x9);
  if (input.file_9x16) formData.append("file_9x16", input.file_9x16);
  if (input.video_16x9_url) {
    formData.append("video_16x9_url", input.video_16x9_url);
  }
  if (input.video_9x16_url) {
    formData.append("video_9x16_url", input.video_9x16_url);
  }
  return apiFetch<ReportRead>(`/api/reports/${reportId}/avatar`, {
    method: "POST",
    body: formData,
  });
}

export function getReportJobs(reportId: string): Promise<ReportJobRead[]> {
  return apiFetch<ReportJobRead[]>(`/api/reports/${reportId}/jobs`);
}
