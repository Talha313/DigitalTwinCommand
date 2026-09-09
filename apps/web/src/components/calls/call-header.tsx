import { ArrowDownLeft, ArrowUpRight, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { formatDuration } from "@/lib/format";
import type { CallParticipant, CallState } from "@/lib/mock-data/types";

const ACTIVE_STATES: CallState[] = [
  "RINGING",
  "CONNECTING",
  "LISTENING",
  "THINKING",
  "SPEAKING",
  "WHISPER_QUEUED",
  "HOLD",
  "MUTED",
];

export interface CallHeaderProps {
  participant: CallParticipant;
  state: CallState;
  seconds: number;
  className?: string;
}

export function CallHeader({
  participant,
  state,
  seconds,
  className,
}: CallHeaderProps) {
  const inbound = participant.direction === "inbound";
  const DirectionIcon = inbound ? ArrowDownLeft : ArrowUpRight;
  const live = ACTIVE_STATES.includes(state);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60">
          <Phone className="h-5 w-5 text-primary" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {participant.name}
            </h2>
            <Badge variant="outline" className="gap-1">
              <DirectionIcon className="h-3 w-3" aria-hidden />
              {inbound ? "Inbound" : "Outbound"}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-mono">{participant.number}</span>
            {participant.company ? ` · ${participant.company}` : ""}
            {participant.location ? ` · ${participant.location}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Duration
          </p>
          <p className="font-mono text-sm tabular-nums text-foreground">
            {formatDuration(seconds)}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground">
          <StatusDot tone={live ? "positive" : "neutral"} pulse={live} />
          {live ? "Live" : "Not connected"}
        </span>
      </div>
    </div>
  );
}
