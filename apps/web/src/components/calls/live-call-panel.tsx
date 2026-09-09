"use client";

import * as React from "react";

import { RiskBadge } from "@/components/roles/risk-badge";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { combinedRisk, rolesByIds } from "@/lib/role-context";
import { formatDuration } from "@/lib/format";
import { liveCall, suggestedWhispers } from "@/lib/mock-data/calls";
import type {
  CallParticipant,
  CallState,
  TranscriptUtterance,
  WhisperEntry,
} from "@/lib/mock-data/types";

import { AudioVisualizer } from "./audio-visualizer";
import { CallControls } from "./call-controls";
import { CallHeader } from "./call-header";
import { CallRoleSelector } from "./role-selector";
import { CallStatus } from "./call-status";
import { Dialer } from "./dialer";
import { TranscriptPanel } from "./transcript-panel";
import { WhisperPanel } from "./whisper-panel";

const LIVE_SUBSTATES: CallState[] = [
  "LISTENING",
  "THINKING",
  "SPEAKING",
  "WHISPER_QUEUED",
];

/** Conversational sub-state loop: [nextState, delayMs]. */
const CYCLE: Partial<Record<CallState, [CallState, number]>> = {
  LISTENING: ["THINKING", 3400],
  THINKING: ["SPEAKING", 1600],
  SPEAKING: ["LISTENING", 3600],
  WHISPER_QUEUED: ["LISTENING", 1800],
};

const isLiveSubstate = (state: CallState) => LIVE_SUBSTATES.includes(state);

export function LiveCallPanel() {
  const [state, setState] = React.useState<CallState>("LISTENING");
  const [seconds, setSeconds] = React.useState(37);
  const [participant, setParticipant] = React.useState<CallParticipant>(
    liveCall.participant,
  );
  const [roleIds, setRoleIds] = React.useState<string[]>(liveCall.roleIds);
  const [transcript, setTranscript] = React.useState<TranscriptUtterance[]>(
    liveCall.transcript,
  );
  const [whispers, setWhispers] = React.useState<WhisperEntry[]>([]);

  const secondsRef = React.useRef(seconds);
  const resumeRef = React.useRef<CallState>("LISTENING");
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = React.useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
  }, []);

  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  React.useEffect(() => clearTimers, [clearTimers]);

  // Duration timer — runs while the call is connected.
  React.useEffect(() => {
    const counting =
      isLiveSubstate(state) || state === "HOLD" || state === "MUTED";
    if (!counting) return;
    const id = setInterval(() => {
      setSeconds((current) => {
        const next = current + 1;
        secondsRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state]);

  // Conversational sub-state loop.
  React.useEffect(() => {
    const nextStep = CYCLE[state];
    if (!nextStep) return;
    const [target, delay] = nextStep;
    const id = setTimeout(() => setState(target), delay);
    return () => clearTimeout(id);
  }, [state]);

  const dial = (number: string) => {
    clearTimers();
    setParticipant({
      name: "Outbound call",
      number,
      direction: "outbound",
    });
    setTranscript([]);
    setWhispers([]);
    setSeconds(0);
    secondsRef.current = 0;
    setState("RINGING");
    schedule(() => setState("CONNECTING"), 1500);
    schedule(() => setState("LISTENING"), 3000);
  };

  const hangUp = () => {
    clearTimers();
    setState("ENDING");
    schedule(() => setState("ENDED"), 1400);
  };

  const toggleMute = () => {
    if (state === "MUTED") {
      setState(resumeRef.current);
      return;
    }
    if (isLiveSubstate(state) || state === "HOLD") {
      resumeRef.current = state === "HOLD" ? "LISTENING" : state;
      setState("MUTED");
    }
  };

  const toggleHold = () => {
    if (state === "HOLD") {
      setState(resumeRef.current);
      return;
    }
    if (isLiveSubstate(state) || state === "MUTED") {
      resumeRef.current = state === "MUTED" ? "LISTENING" : state;
      setState("HOLD");
    }
  };

  const sendWhisper = (text: string) => {
    const id = `w-${Date.now()}`;
    const stamp = formatDuration(secondsRef.current);

    setWhispers((prev) => [
      { id, text, status: "queued", sentAtLabel: `Sent at ${stamp}` },
      ...prev,
    ]);
    setTranscript((prev) => [
      ...prev,
      {
        id: `u-${id}`,
        speaker: "whisper",
        text,
        timestamp: stamp,
        whisperStatus: "queued",
      },
    ]);
    if (isLiveSubstate(state)) setState("WHISPER_QUEUED");

    schedule(() => {
      setWhispers((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: "consumed" } : w)),
      );
      setTranscript((prev) =>
        prev.map((u) =>
          u.id === `u-${id}` ? { ...u, whisperStatus: "consumed" } : u,
        ),
      );
    }, 1600);
    schedule(() => {
      setWhispers((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: "spoken" } : w)),
      );
      setTranscript((prev) =>
        prev.map((u) =>
          u.id === `u-${id}` ? { ...u, whisperStatus: "spoken" } : u,
        ),
      );
    }, 3400);
  };

  const activeRoles = rolesByIds(roleIds);
  const controlsDisabled =
    state === "IDLE" || state === "ENDED" || state === "ENDING";
  const speakingTone: "twin" | "caller" | "idle" =
    state === "SPEAKING"
      ? "twin"
      : state === "LISTENING"
        ? "caller"
        : "idle";

  if (state === "IDLE" || state === "ENDED") {
    return (
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <Dialer
          onDial={dial}
          lastCall={
            state === "ENDED" ? { participant, seconds } : null
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-4 p-4 sm:p-6 lg:h-full lg:min-h-0">
      <CallHeader
        participant={participant}
        state={state}
        seconds={seconds}
        className="shrink-0"
      />

      <div className="grid flex-1 gap-4 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <CallStatus state={state} />

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Voice activity
              </p>
              <span className="text-[11px] text-muted-foreground">
                {state === "SPEAKING"
                  ? "Twin speaking"
                  : state === "LISTENING"
                    ? "Caller speaking"
                    : "Quiet"}
              </span>
            </div>
            <AudioVisualizer
              active={state === "SPEAKING" || state === "LISTENING"}
              tone={speakingTone}
            />
          </div>

          <CallControls
            state={state}
            onToggleMute={toggleMute}
            onToggleHold={toggleHold}
            onHangup={hangUp}
          />

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Active roles
              </p>
              <CallRoleSelector value={roleIds} onChange={setRoleIds} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {activeRoles.length > 0 ? (
                <>
                  {activeRoles.map((role) => (
                    <RoleBadge key={role.id} name={role.name} />
                  ))}
                  <RiskBadge level={combinedRisk(roleIds)} className="ml-1" />
                </>
              ) : (
                <p className="text-xs text-amber-300">
                  No roles selected for this call.
                </p>
              )}
            </div>
          </div>

          <WhisperPanel
            whispers={whispers}
            suggestions={suggestedWhispers}
            onSend={sendWhisper}
            disabled={controlsDisabled}
          />
        </div>

        <TranscriptPanel
          utterances={transcript}
          state={state}
          className="lg:min-h-0"
        />
      </div>
    </div>
  );
}
