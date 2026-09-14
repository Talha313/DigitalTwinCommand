import {
  FileStack,
  MessageSquareText,
  MessagesSquare,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";

import { SOURCE_LABEL, type MemorySourceType } from "@/lib/memory";

const SOURCE_ICON: Record<MemorySourceType, LucideIcon> = {
  chat: MessagesSquare,
  call: PhoneCall,
  whisper: MessageSquareText,
  document: FileStack,
};

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

export interface KnowledgeSourceProps {
  source: MemorySourceType;
  count: number;
}

/** Real per-source record count derived from the fetched memory list — no
 * "collecting" status or last-updated timestamp exists server-side, so this
 * is deliberately simpler than the original mock design. */
export function KnowledgeSource({ source, count }: KnowledgeSourceProps) {
  const Icon = SOURCE_ICON[source];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-sm font-medium text-foreground">{SOURCE_LABEL[source]}</p>
      <span className="mt-auto text-lg font-semibold text-foreground">
        {NUMBER_FORMAT.format(count)}
      </span>
    </div>
  );
}
