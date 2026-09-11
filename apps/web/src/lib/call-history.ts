/**
 * Call History UI helpers.
 *
 * The history page uses the same `GET /api/calls` + `GET /api/calls/{id}/transcript`
 * endpoints as the live-call screen (see lib/calls.ts) — this file only adds
 * the bits that are specific to browsing a table of past calls: a simplified
 * status bucket for the filter UI, the real outcome vocabulary, and a
 * transcript mapper that mirrors `mapInitialTranscript` in
 * `hooks/use-live-call.ts`.
 */
import { formatDuration } from "./format";
import {
  toUiDirection,
  type BackendCallStatus,
  type CallRead,
  type UtteranceRead,
} from "./calls";
import type { TranscriptUtterance } from "./mock-data/types";

/** Simplified status bucket for the history filter/badge UI. */
export type UiCallStatus = "completed" | "missed" | "in-progress" | "failed";

export function toUiStatus(status: BackendCallStatus): UiCallStatus {
  switch (status) {
    case "completed":
      return "completed";
    case "no_answer":
    case "canceled":
      return "missed";
    case "failed":
      return "failed";
    case "queued":
    case "ringing":
    case "in_progress":
    case "connected":
      return "in-progress";
  }
}

/**
 * Real outcomes the backend supports (`CallOutcome` in
 * backend/app/db/models/enums.py, set via `PATCH /api/calls/{id}/outcome`).
 * `CallRead.outcome` is `null` until an operator sets one.
 */
export type CallOutcome = "won" | "lost" | "follow_up" | "junk";

/** The other party's number: from_e164 for inbound calls, to_e164 for outbound. */
export function counterpartyNumber(call: CallRead): string {
  const direction = toUiDirection(call.direction);
  return (direction === "inbound" ? call.from_e164 : call.to_e164) ?? "Unknown";
}

/** started_at once the call connected, falling back to created_at (e.g. no-answer calls). */
export function callTimestamp(call: CallRead): string {
  return call.started_at ?? call.created_at;
}

export function formatCallTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Maps transcript rows to call-relative mm:ss timestamps, mirroring
 * `mapInitialTranscript` in hooks/use-live-call.ts. Whisper utterances are
 * marked "spoken" — there's no per-utterance status on historical rows, but
 * anything that made it into a completed call's transcript was delivered.
 */
export function mapCallTranscript(
  call: CallRead,
  rows: UtteranceRead[],
): TranscriptUtterance[] {
  const startedAt = call.started_at ? new Date(call.started_at).getTime() : null;
  return rows.map((u) => {
    const ts = new Date(u.timestamp).getTime();
    const rel = startedAt != null ? Math.max(0, Math.floor((ts - startedAt) / 1000)) : 0;
    return {
      id: u.id,
      speaker: u.speaker,
      text: u.text,
      timestamp: formatDuration(rel),
      whisperStatus: u.speaker === "whisper" ? ("spoken" as const) : undefined,
    };
  });
}
