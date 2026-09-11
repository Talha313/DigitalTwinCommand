/**
 * Dashboard-summary API calls: a minimal reports list + system health.
 *
 * Types mirror backend/app/models/reports.py::ReportListItem and
 * backend/app/models/common.py::HealthResponse. This is intentionally
 * small — the Reports page (lib/reports.ts) owns the full, richer report
 * client; the dashboard only needs a summary list for its widget.
 */
import { apiFetch } from "./api-client";

export type BackendReportStatus =
  | "queued"
  | "researching"
  | "script_ready"
  | "approved"
  | "generating"
  | "awaiting_avatar"
  | "ready"
  | "failed";

export interface ReportListItem {
  id: string;
  date: string | null;
  status: BackendReportStatus;
  model: string | null;
  cost_cents: number | null;
  created_at: string;
}

export function listReports(): Promise<ReportListItem[]> {
  return apiFetch<ReportListItem[]>("/api/reports");
}

export type IntegrationKey =
  | "anthropic"
  | "elevenlabs"
  | "elevenlabs_agent"
  | "twilio"
  | "lipsync"
  | "storage"
  | "push";

export interface HealthResponse {
  status: "ok" | "degraded";
  environment: string;
  call_llm: string;
  chat_llm: string;
  lipsync: string;
  storage: string;
  database: boolean;
  integrations: Record<IntegrationKey, boolean>;
}

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/api/health");
}
