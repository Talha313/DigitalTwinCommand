/** Calls + whispers API calls. Types mirror backend/app/models/calls.py. */
import { apiFetch } from "./api-client";
import type {
  CallDirection as UiCallDirection,
  UtteranceSpeaker,
  WhisperStatus as UiWhisperStatus,
} from "./mock-data/types";

export type BackendCallDirection = "incoming" | "outgoing";
export type BackendCallStatus =
  | "queued"
  | "ringing"
  | "in_progress"
  | "connected"
  | "completed"
  | "failed"
  | "no_answer"
  | "canceled";
export type BackendWhisperStatus = "queued" | "injected" | "spoken" | "failed";
export type WhisperKind = "contextual_update" | "user_message";

export interface CallRead {
  id: string;
  user_id: string | null;
  direction: BackendCallDirection;
  status: BackendCallStatus;
  outcome: string | null;
  from_e164: string | null;
  to_e164: string | null;
  twilio_sid: string | null;
  eleven_conversation_id: string | null;
  recording_url: string | null;
  recording_consent: boolean;
  model: string | null;
  summary: string | null;
  tool_call_count: number;
  cost_cents: number | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  role_ids: string[];
}

export interface UtteranceRead {
  id: string;
  call_id: string;
  speaker: UtteranceSpeaker;
  text: string;
  source: string;
  timestamp: string;
}

export interface WhisperRead {
  id: string;
  call_id: string;
  text: string;
  kind: WhisperKind;
  status: BackendWhisperStatus;
  created_at: string;
  injected_at: string | null;
  spoken_at: string | null;
  used_in_training: boolean;
}

const ACTIVE_STATUSES: BackendCallStatus[] = [
  "queued",
  "ringing",
  "in_progress",
  "connected",
];

export function toUiDirection(direction: BackendCallDirection): UiCallDirection {
  return direction === "incoming" ? "inbound" : "outbound";
}

export function toUiWhisperStatus(status: BackendWhisperStatus): UiWhisperStatus {
  if (status === "injected") return "consumed";
  if (status === "spoken") return "spoken";
  return "queued";
}

export function listCalls(): Promise<CallRead[]> {
  return apiFetch<CallRead[]>("/api/calls");
}

export function getCall(callId: string): Promise<CallRead> {
  return apiFetch<CallRead>(`/api/calls/${callId}`);
}

export function getTranscript(callId: string): Promise<UtteranceRead[]> {
  return apiFetch<UtteranceRead[]>(`/api/calls/${callId}/transcript`);
}

/** The most recent call still in a non-terminal status, if any. */
export async function findActiveCall(): Promise<CallRead | null> {
  const calls = await listCalls();
  return calls.find((call) => ACTIVE_STATUSES.includes(call.status)) ?? null;
}

export function startOutboundCall(input: {
  to_e164: string;
  role_ids?: string[];
  first_message?: string;
  recording_consent?: boolean;
}): Promise<CallRead> {
  return apiFetch<CallRead>("/api/calls/outbound", {
    method: "POST",
    json: input,
  });
}

export function sendWhisper(
  callId: string,
  text: string,
  kind: WhisperKind = "contextual_update",
): Promise<WhisperRead> {
  return apiFetch<WhisperRead>(`/api/calls/${callId}/whispers`, {
    method: "POST",
    json: { text, kind },
  });
}

export function muteCall(callId: string, muted: boolean): Promise<CallRead> {
  return apiFetch<CallRead>(`/api/calls/${callId}/mute?muted=${muted}`, {
    method: "POST",
  });
}

export function holdCall(callId: string, held: boolean): Promise<CallRead> {
  return apiFetch<CallRead>(`/api/calls/${callId}/hold?held=${held}`, {
    method: "POST",
  });
}

export function hangupCall(callId: string): Promise<CallRead> {
  return apiFetch<CallRead>(`/api/calls/${callId}/hangup`, { method: "POST" });
}
