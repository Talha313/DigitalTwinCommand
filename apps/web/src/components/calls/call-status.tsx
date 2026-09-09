import {
  BrainCircuit,
  Ear,
  Loader2,
  MessageSquareText,
  MicOff,
  PauseCircle,
  PhoneCall,
  PhoneOff,
  TriangleAlert,
  Volume2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { StatusDot, type StatusTone } from "@/components/ui/status-dot";
import type { CallState } from "@/lib/mock-data/types";

interface StateMeta {
  label: string;
  description: string;
  tone: StatusTone;
  icon: LucideIcon;
  spin?: boolean;
}

const STATE_META: Record<CallState, StateMeta> = {
  IDLE: {
    label: "Idle",
    description: "No active call.",
    tone: "neutral",
    icon: PhoneOff,
  },
  RINGING: {
    label: "Ringing",
    description: "Waiting for the other party to answer.",
    tone: "warning",
    icon: PhoneCall,
  },
  CONNECTING: {
    label: "Connecting",
    description: "Establishing the audio channel.",
    tone: "warning",
    icon: Loader2,
    spin: true,
  },
  LISTENING: {
    label: "Listening",
    description: "The Twin is listening to the caller.",
    tone: "positive",
    icon: Ear,
  },
  THINKING: {
    label: "Thinking",
    description: "The Twin is composing a response.",
    tone: "warning",
    icon: BrainCircuit,
  },
  SPEAKING: {
    label: "Speaking",
    description: "The Twin is responding to the caller.",
    tone: "positive",
    icon: Volume2,
  },
  WHISPER_QUEUED: {
    label: "Whisper queued",
    description: "An operator instruction will be used on the next turn.",
    tone: "warning",
    icon: MessageSquareText,
  },
  HOLD: {
    label: "On hold",
    description: "The call is paused. The caller hears hold audio.",
    tone: "warning",
    icon: PauseCircle,
  },
  MUTED: {
    label: "Muted",
    description: "Your microphone is muted. The Twin keeps handling the call.",
    tone: "warning",
    icon: MicOff,
  },
  ENDING: {
    label: "Ending",
    description: "Wrapping up the call.",
    tone: "neutral",
    icon: PhoneOff,
  },
  ENDED: {
    label: "Call ended",
    description: "The call has finished.",
    tone: "neutral",
    icon: PhoneOff,
  },
  ERROR: {
    label: "Call error",
    description: "The call could not be completed.",
    tone: "critical",
    icon: TriangleAlert,
  },
};

export interface CallStatusProps {
  state: CallState;
  className?: string;
}

export function CallStatus({ state, className }: CallStatusProps) {
  const meta = STATE_META[state];
  const Icon = meta.icon;
  const isLive =
    state === "LISTENING" ||
    state === "THINKING" ||
    state === "SPEAKING" ||
    state === "WHISPER_QUEUED";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4",
        className,
      )}
      aria-live="polite"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60">
        <Icon
          className={cn("h-5 w-5 text-primary", meta.spin && "animate-spin")}
          aria-hidden
        />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <StatusDot tone={meta.tone} pulse={isLive} />
          <p className="text-sm font-semibold text-foreground">{meta.label}</p>
        </div>
        <p className="text-xs text-muted-foreground">{meta.description}</p>
      </div>
    </div>
  );
}
