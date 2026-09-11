"use client";

import * as React from "react";

import { getAccessToken, refresh } from "@/lib/auth";
import {
  findActiveCall,
  getTranscript,
  hangupCall,
  holdCall,
  muteCall,
  sendWhisper as sendWhisperApi,
  startOutboundCall,
  toUiDirection,
  toUiWhisperStatus,
  type CallRead,
  type UtteranceRead,
} from "@/lib/calls";
import { formatDuration } from "@/lib/format";
import { connectCallStream, type CallStreamEvent, type CallStreamHandle } from "@/lib/ws-client";
import type {
  CallParticipant,
  CallState,
  TranscriptUtterance,
  WhisperEntry,
} from "@/lib/mock-data/types";

const IDLE_PARTICIPANT: CallParticipant = { name: "", number: "", direction: "outbound" };

const COUNTING_STATES: CallState[] = ["LISTENING", "SPEAKING", "WHISPER_QUEUED", "HOLD", "MUTED"];

function participantFromCall(call: CallRead): CallParticipant {
  const direction = toUiDirection(call.direction);
  const number = (direction === "inbound" ? call.from_e164 : call.to_e164) ?? "Unknown";
  return { name: number, number, direction };
}

function stateFromStatus(status: CallRead["status"]): CallState {
  switch (status) {
    case "queued":
    case "ringing":
      return "RINGING";
    case "in_progress":
      return "CONNECTING";
    case "connected":
      return "LISTENING";
    case "completed":
    case "no_answer":
    case "canceled":
      return "ENDED";
    case "failed":
      return "ERROR";
    default:
      return "IDLE";
  }
}

function mapInitialTranscript(call: CallRead, rows: UtteranceRead[]): TranscriptUtterance[] {
  const startedAt = call.started_at ? new Date(call.started_at).getTime() : null;
  return rows.map((u) => {
    const ts = new Date(u.timestamp).getTime();
    const rel = startedAt != null ? Math.max(0, Math.floor((ts - startedAt) / 1000)) : 0;
    return { id: u.id, speaker: u.speaker, text: u.text, timestamp: formatDuration(rel) };
  });
}

export function useLiveCall() {
  const [callId, setCallId] = React.useState<string | null>(null);
  const [state, setState] = React.useState<CallState>("IDLE");
  const [seconds, setSeconds] = React.useState(0);
  const [participant, setParticipant] = React.useState<CallParticipant>(IDLE_PARTICIPANT);
  const [roleIds, setRoleIds] = React.useState<string[]>([]);
  const [transcript, setTranscript] = React.useState<TranscriptUtterance[]>([]);
  const [whispers, setWhispers] = React.useState<WhisperEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const startedAtRef = React.useRef<number | null>(null);
  const resumeRef = React.useRef<CallState>("LISTENING");
  const streamRef = React.useRef<CallStreamHandle | null>(null);

  const disconnectStream = React.useCallback(() => {
    streamRef.current?.close();
    streamRef.current = null;
  }, []);

  const elapsedNow = React.useCallback(() => {
    if (startedAtRef.current == null) return 0;
    return Math.floor((Date.now() - startedAtRef.current) / 1000);
  }, []);

  const handleEvent = React.useCallback(
    (event: CallStreamEvent) => {
      switch (event.type) {
        case "status": {
          if (event.status === "connected") {
            if (startedAtRef.current == null) startedAtRef.current = Date.now();
            setState("LISTENING");
          } else if (event.status === "listening") {
            setState((current) => (current === "MUTED" || current === "HOLD" ? current : "LISTENING"));
          } else if (event.status === "speaking") {
            setState((current) => (current === "MUTED" || current === "HOLD" ? current : "SPEAKING"));
          } else if (event.status === "ended") {
            setState("ENDED");
            disconnectStream();
          }
          break;
        }
        case "transcript": {
          setTranscript((prev) => [
            ...prev,
            {
              id: `u-${event.seq}`,
              speaker: event.speaker,
              text: event.text,
              timestamp: formatDuration(elapsedNow()),
            },
          ]);
          break;
        }
        case "transcript_correction": {
          setTranscript((prev) => {
            const revIdx = [...prev].reverse().findIndex((u) => u.speaker === event.speaker);
            if (revIdx === -1) return prev;
            const idx = prev.length - 1 - revIdx;
            const target = prev[idx];
            if (!target) return prev;
            const next = [...prev];
            next[idx] = { ...target, text: event.text };
            return next;
          });
          break;
        }
        case "whisper": {
          const uiStatus = toUiWhisperStatus(event.status);
          const stamp = `Sent at ${formatDuration(elapsedNow())}`;
          setWhispers((prev) =>
            prev.some((w) => w.id === event.whisper_id)
              ? prev.map((w) => (w.id === event.whisper_id ? { ...w, status: uiStatus } : w))
              : [{ id: event.whisper_id, text: event.text, status: uiStatus, sentAtLabel: stamp }, ...prev],
          );
          setTranscript((prev) =>
            prev.some((u) => u.id === `w-${event.whisper_id}`)
              ? prev.map((u) =>
                  u.id === `w-${event.whisper_id}` ? { ...u, whisperStatus: uiStatus } : u,
                )
              : [
                  ...prev,
                  {
                    id: `w-${event.whisper_id}`,
                    speaker: "whisper" as const,
                    text: event.text,
                    timestamp: formatDuration(elapsedNow()),
                    whisperStatus: uiStatus,
                  },
                ],
          );
          break;
        }
        default:
          break;
      }
    },
    [disconnectStream, elapsedNow],
  );

  const connectToCall = React.useCallback(
    (call: CallRead, initialTranscript: TranscriptUtterance[] = []) => {
      disconnectStream();
      setCallId(call.id);
      setParticipant(participantFromCall(call));
      setRoleIds(call.role_ids);
      setTranscript(initialTranscript);
      setWhispers([]);
      setError(null);
      startedAtRef.current = call.started_at ? new Date(call.started_at).getTime() : null;
      setSeconds(startedAtRef.current != null ? Math.floor((Date.now() - startedAtRef.current) / 1000) : 0);
      setState(stateFromStatus(call.status));
      streamRef.current = connectCallStream(call.id, { onEvent: handleEvent });
    },
    [disconnectStream, handleEvent],
  );

  const checkForActiveCall = React.useCallback(
    async (isCancelled: () => boolean) => {
      const active = await findActiveCall();
      if (isCancelled() || !active) return;
      const rows = await getTranscript(active.id);
      if (isCancelled()) return;
      connectToCall(active, mapInitialTranscript(active, rows));
    },
    [connectToCall],
  );

  // Resume whatever call is already live when the page loads.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!getAccessToken()) {
          await refresh().catch(() => null);
        }
        await checkForActiveCall(() => cancelled);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load calls.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      disconnectStream();
    };
    // Deliberately mount-only: checkForActiveCall/disconnectStream are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nothing is live right now — poll for a call that starts while we're
  // sitting on this page (e.g. an inbound call), so it's picked up without
  // requiring a manual refresh.
  React.useEffect(() => {
    if (loading || (state !== "IDLE" && state !== "ENDED")) return;
    let cancelled = false;
    let inFlight = false;
    const id = setInterval(() => {
      if (inFlight) return;
      inFlight = true;
      checkForActiveCall(() => cancelled)
        .catch(() => {
          /* transient — try again next tick */
        })
        .finally(() => {
          inFlight = false;
        });
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [loading, state, checkForActiveCall]);

  // Duration ticker — mirrors the real call while it's live.
  React.useEffect(() => {
    if (!COUNTING_STATES.includes(state)) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  const dial = React.useCallback(
    async (number: string) => {
      setError(null);
      try {
        const call = await startOutboundCall({ to_e164: number, recording_consent: false });
        connectToCall(call);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to place call.");
      }
    },
    [connectToCall],
  );

  const hangUp = React.useCallback(async () => {
    if (!callId) return;
    setState("ENDING");
    try {
      await hangupCall(callId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to hang up.");
    } finally {
      setState("ENDED");
      disconnectStream();
    }
  }, [callId, disconnectStream]);

  const toggleMute = React.useCallback(async () => {
    if (!callId) return;
    const willMute = state !== "MUTED";
    try {
      await muteCall(callId, willMute);
      if (willMute) {
        resumeRef.current = state === "HOLD" ? "LISTENING" : state;
        setState("MUTED");
      } else {
        setState(resumeRef.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle mute.");
    }
  }, [callId, state]);

  const toggleHold = React.useCallback(async () => {
    if (!callId) return;
    const willHold = state !== "HOLD";
    try {
      await holdCall(callId, willHold);
      if (willHold) {
        resumeRef.current = state === "MUTED" ? "LISTENING" : state;
        setState("HOLD");
      } else {
        setState(resumeRef.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle hold.");
    }
  }, [callId, state]);

  const sendWhisper = React.useCallback(
    async (text: string) => {
      if (!callId) return;
      try {
        const res = await sendWhisperApi(callId, text);
        const stamp = formatDuration(elapsedNow());
        const uiStatus = toUiWhisperStatus(res.status);
        // The server broadcasts the "whisper" WS event before this HTTP
        // response returns, so it routinely arrives and gets added first —
        // dedupe the same way the WS handler does instead of adding blindly.
        setWhispers((prev) =>
          prev.some((w) => w.id === res.id)
            ? prev.map((w) => (w.id === res.id ? { ...w, status: uiStatus } : w))
            : [{ id: res.id, text, status: uiStatus, sentAtLabel: `Sent at ${stamp}` }, ...prev],
        );
        setTranscript((prev) =>
          prev.some((u) => u.id === `w-${res.id}`)
            ? prev.map((u) => (u.id === `w-${res.id}` ? { ...u, whisperStatus: uiStatus } : u))
            : [
                ...prev,
                { id: `w-${res.id}`, speaker: "whisper", text, timestamp: stamp, whisperStatus: uiStatus },
              ],
        );
        setState((current) => (current === "LISTENING" || current === "SPEAKING" ? "WHISPER_QUEUED" : current));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send whisper.");
      }
    },
    [callId, elapsedNow],
  );

  return {
    state,
    seconds,
    participant,
    roleIds,
    setRoleIds,
    transcript,
    whispers,
    loading,
    error,
    dial,
    hangUp,
    toggleMute,
    toggleHold,
    sendWhisper,
  };
}
