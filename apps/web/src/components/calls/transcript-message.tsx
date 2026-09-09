import { MessageSquareText } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  TranscriptUtterance,
  WhisperStatus,
} from "@/lib/mock-data/types";

const WHISPER_STATUS: Record<WhisperStatus, { label: string; className: string }> =
  {
    queued: { label: "Queued", className: "text-amber-300" },
    consumed: { label: "Consumed", className: "text-sky-300" },
    spoken: { label: "Spoken", className: "text-emerald-300" },
  };

export function WhisperStatusBadge({
  status,
  className,
}: {
  status: WhisperStatus;
  className?: string;
}) {
  const meta = WHISPER_STATUS[status];
  return (
    <span className={cn("text-[11px] font-medium", meta.className, className)}>
      {meta.label}
    </span>
  );
}

export interface TranscriptMessageProps {
  utterance: TranscriptUtterance;
}

export function TranscriptMessage({ utterance }: TranscriptMessageProps) {
  if (utterance.speaker === "whisper") {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-md rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-wide text-primary">
              Operator whisper
            </span>
            <WhisperStatusBadge
              status={utterance.whisperStatus ?? "queued"}
              className="ml-auto"
            />
          </div>
          <p className="mt-1 text-xs text-foreground">{utterance.text}</p>
        </div>
      </div>
    );
  }

  const isCaller = utterance.speaker === "caller";

  return (
    <div className={cn("flex", isCaller ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 sm:max-w-[75%]",
          isCaller
            ? "rounded-tl-sm border border-border/60 bg-background/50"
            : "rounded-br-sm border border-primary/20 bg-primary/10",
        )}
      >
        <div className="mb-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground/80">
            {isCaller ? "Caller" : "Digital Twin"}
          </span>
          {utterance.partial ? (
            <span className="text-amber-300">partial</span>
          ) : null}
          <span className="tabular-nums">{utterance.timestamp}</span>
        </div>
        <p
          className={cn(
            "whitespace-pre-wrap text-sm",
            utterance.partial ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {utterance.text}
        </p>
      </div>
    </div>
  );
}
