"use client";

import {
  Mic,
  MicOff,
  Pause,
  PhoneOff,
  Play,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CallState } from "@/lib/mock-data/types";

interface ControlButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ControlButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-lg border p-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40",
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

export interface CallControlsProps {
  state: CallState;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onHangup: () => void;
  className?: string;
  holdPending?: boolean;
}

export function CallControls({
  state,
  onToggleMute,
  onToggleHold,
  onHangup,
  holdPending = false,
  className,
}: CallControlsProps) {
  const muted = state === "MUTED";
  const held = state === "HOLD";
  const ending = state === "ENDING";
  const disabled = ending || state === "ENDED" || state === "IDLE";

  return (
    <div
      className={cn(
        "flex items-stretch gap-2 rounded-xl border border-border/60 bg-card p-3",
        className,
      )}
    >
      <ControlButton
        icon={muted ? MicOff : Mic}
        label={muted ? "Unmute" : "Mute"}
        active={muted}
        disabled={disabled || held || holdPending}
        onClick={onToggleMute}
      />
      <ControlButton
        icon={held ? Play : Pause}
        label={holdPending ? "Please wait…" : held ? "Resume" : "Hold"}
        active={held}
        disabled={disabled || holdPending || state === "RINGING" || state === "CONNECTING"}
        onClick={onToggleHold}
      />
      <Button
        variant="destructive"
        onClick={onHangup}
        disabled={disabled}
        className="h-auto flex-1 flex-col gap-1 px-2.5 py-2.5 text-xs"
      >
        <PhoneOff className="h-4 w-4" aria-hidden />
        {ending ? "Ending…" : "Hang up"}
      </Button>
    </div>
  );
}
