"use client";

import { RiskBadge } from "@/components/roles/risk-badge";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { useLiveCall } from "@/hooks/use-live-call";
import { combinedRisk, rolesByIds } from "@/lib/role-context";
import { suggestedWhispers } from "@/lib/mock-data/calls";

import { AudioVisualizer } from "./audio-visualizer";
import { CallControls } from "./call-controls";
import { CallHeader } from "./call-header";
import { CallRoleSelector } from "./role-selector";
import { CallStatus } from "./call-status";
import { Dialer } from "./dialer";
import { TranscriptPanel } from "./transcript-panel";
import { WhisperPanel } from "./whisper-panel";

export function LiveCallPanel() {
  const {
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
  } = useLiveCall();

  const activeRoles = rolesByIds(roleIds);
  const controlsDisabled =
    state === "IDLE" || state === "ENDED" || state === "ENDING";
  const speakingTone: "twin" | "caller" | "idle" =
    state === "SPEAKING"
      ? "twin"
      : state === "LISTENING"
        ? "caller"
        : "idle";

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center p-4 text-sm text-muted-foreground sm:p-6">
        Checking for a live call…
      </div>
    );
  }

  if (state === "IDLE" || state === "ENDED") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-4 sm:p-6">
        {error ? (
          <p className="w-full max-w-sm rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-center text-xs text-destructive">
            {error}
          </p>
        ) : null}
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
      {error ? (
        <p className="shrink-0 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </p>
      ) : null}

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
