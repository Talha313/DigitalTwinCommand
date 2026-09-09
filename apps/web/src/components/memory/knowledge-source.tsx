import {
  FileBarChart,
  FileStack,
  FileText,
  MessageSquareText,
  MessagesSquare,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";

import { StatusDot } from "@/components/ui/status-dot";
import {
  SOURCE_LABEL,
  type KnowledgeSourceId,
  type KnowledgeSourceInfo,
} from "@/lib/mock-data/memory";

const SOURCE_ICON: Record<KnowledgeSourceId, LucideIcon> = {
  chat: MessagesSquare,
  call: PhoneCall,
  transcript: FileText,
  whisper: MessageSquareText,
  report: FileBarChart,
  document: FileStack,
};

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

export interface KnowledgeSourceProps {
  source: KnowledgeSourceInfo;
}

export function KnowledgeSource({ source }: KnowledgeSourceProps) {
  const Icon = SOURCE_ICON[source.id];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <StatusDot
            tone={source.collecting ? "positive" : "neutral"}
            pulse={source.collecting}
          />
          {source.collecting ? "Collecting" : "Paused"}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {SOURCE_LABEL[source.id]}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {source.description}
        </p>
      </div>
      <div className="mt-auto flex items-baseline justify-between">
        <span className="text-lg font-semibold text-foreground">
          {NUMBER_FORMAT.format(source.recordCount)}
        </span>
        <span className="text-[11px] text-muted-foreground">
          Updated {source.lastUpdatedLabel}
        </span>
      </div>
    </div>
  );
}
