/**
 * Frontend-only mock data types for the dashboard experience.
 *
 * The canonical domain models live in `packages/shared` / `packages/database`
 * and are wired in a later phase. These types exist purely to keep the UI
 * strongly typed while it runs on mock data.
 */

export type TwinStatus = "online" | "offline" | "degraded";
export type TwinMode = "listening" | "thinking" | "speaking" | "idle";
export type ServiceState = "connected" | "ready" | "disconnected" | "error";

export interface TwinRole {
  id: string;
  name: string;
}

export interface TwinSnapshot {
  status: TwinStatus;
  mode: TwinMode;
  roles: TwinRole[];
  voice: ServiceState;
  aiEngine: ServiceState;
}

export type MetricTone = "positive" | "neutral" | "warning";

export interface SystemMetric {
  id: string;
  label: string;
  value: string;
  detail?: string;
  state?: ServiceState;
  tone?: MetricTone;
}

export type CallStatus = "completed" | "missed" | "in-progress" | "failed";

export interface CallRecord {
  id: string;
  caller: string;
  role: string;
  duration: string;
  status: CallStatus;
  date: string;
}

export type ReportStatus = "ready" | "processing" | "queued" | "failed";

export interface ReportRecord {
  id: string;
  title: string;
  status: ReportStatus;
  createdLabel: string;
}

export type ActivityKind = "call" | "report" | "role" | "system" | "voice";

export interface ActivityEntry {
  id: string;
  time: string;
  title: string;
  kind: ActivityKind;
}

/* ---------------------------------------------------------------------------
 * Roles
 * Mirrors the `roles` table shape from CLAUDE.md (id, name, description,
 * system_prompt, tone/personality, risk_level, active, timestamps).
 * ------------------------------------------------------------------------- */

export type RiskLevel = "low" | "medium" | "high";

export interface RolePermission {
  /** Dotted identifier, e.g. "portfolio.read". */
  id: string;
  label: string;
  description: string;
  risk: RiskLevel;
}

export interface RoleTool {
  /** Snake-case identifier, e.g. "market_search". */
  id: string;
  name: string;
  description: string;
  risk: RiskLevel;
}

export interface RolePersonality {
  tone: string;
  summary: string;
  traits: string[];
  /** Short excerpt only — the full system prompt is never exposed in the UI. */
  systemPromptPreview: string;
}

export interface Role {
  id: string;
  name: string;
  shortName: string;
  description: string;
  personality: RolePersonality;
  riskLevel: RiskLevel;
  tools: RoleTool[];
  permissions: RolePermission[];
  active: boolean;
  updatedLabel: string;
}

/* ---------------------------------------------------------------------------
 * Chat
 * Real chat types now live in `@/lib/chat` (backend-backed). Only
 * `suggestedPrompts` in `mock-data/chat.ts` remains — static canned example
 * prompts for the empty state, not fake backend data.
 * ------------------------------------------------------------------------- */

/* ---------------------------------------------------------------------------
 * Live call
 * Explicit call-state machine (CLAUDE.md) — never boolean flags.
 * ------------------------------------------------------------------------- */

export type CallState =
  | "IDLE"
  | "RINGING"
  | "CONNECTING"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "WHISPER_QUEUED"
  | "HOLD"
  | "MUTED"
  | "ENDING"
  | "ENDED"
  | "ERROR";

export type CallDirection = "inbound" | "outbound";

export type UtteranceSpeaker = "caller" | "twin" | "whisper";

export type WhisperStatus = "queued" | "consumed" | "spoken";

export interface TranscriptUtterance {
  id: string;
  speaker: UtteranceSpeaker;
  text: string;
  /** Call-relative timestamp, e.g. "00:42". */
  timestamp: string;
  partial?: boolean;
  /** Only set when speaker === "whisper". */
  whisperStatus?: WhisperStatus;
}

export interface CallParticipant {
  name: string;
  number: string;
  direction: CallDirection;
  company?: string;
  location?: string;
}

export interface LiveCall {
  id: string;
  participant: CallParticipant;
  roleIds: string[];
  transcript: TranscriptUtterance[];
}

export interface WhisperEntry {
  id: string;
  text: string;
  status: WhisperStatus;
  sentAtLabel: string;
}

/* ---------------------------------------------------------------------------
 * Call history — review of completed calls (mirrors the `calls` table)
 * ------------------------------------------------------------------------- */

export type CallOutcome =
  | "resolved"
  | "follow_up_scheduled"
  | "info_provided"
  | "voicemail"
  | "no_answer"
  | "dropped"
  | "escalated";

export interface CallHistoryWhisper {
  id: string;
  text: string;
  queuedAt: string;
  spokenAt?: string;
  usedInTraining: boolean;
}

export interface CallHistoryEntry {
  id: string;
  caller: string;
  fromNumber: string;
  toNumber: string;
  direction: CallDirection;
  status: CallStatus;
  outcome: CallOutcome;
  roleIds: string[];
  dateLabel: string;
  startedAtLabel: string;
  durationSeconds: number;
  twilioSid: string;
  elevenConversationId: string;
  recordingAvailable: boolean;
  model: string;
  toolCalls: number;
  summary: string;
  transcript: TranscriptUtterance[];
  whispers: CallHistoryWhisper[];
}
