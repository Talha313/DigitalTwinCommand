/**
 * AI Memory & Training Center — UI preview only.
 *
 * CLAUDE.md: capture training-quality data now, but do NOT implement fine-tuning
 * in V1. Nothing here embeds, indexes, or trains — it is a review surface for
 * data being collected toward a future Gold Dataset.
 */

export type KnowledgeSourceId =
  | "chat"
  | "call"
  | "transcript"
  | "whisper"
  | "report"
  | "document";

export type MemoryApprovalStatus = "pending" | "approved" | "rejected";

export type DataQuality = "high" | "medium" | "low";

export type MemoryKind =
  | "conversation_pair"
  | "operator_edit"
  | "whisper_guidance"
  | "call_outcome"
  | "approved_script"
  | "document_fact";

export const MEMORY_KIND_LABEL: Record<MemoryKind, string> = {
  conversation_pair: "Conversation pair",
  operator_edit: "Operator edit",
  whisper_guidance: "Whisper guidance",
  call_outcome: "Call outcome",
  approved_script: "Approved script",
  document_fact: "Document fact",
};

export const SOURCE_LABEL: Record<KnowledgeSourceId, string> = {
  chat: "Chat conversations",
  call: "Voice calls",
  transcript: "Transcripts",
  whisper: "Operator whispers",
  report: "Reports",
  document: "Documents",
};

export interface MemoryExcerpt {
  label: string;
  text: string;
}

export interface MemoryRecord {
  id: string;
  title: string;
  source: KnowledgeSourceId;
  kind: MemoryKind;
  quality: DataQuality;
  status: MemoryApprovalStatus;
  createdLabel: string;
  tags: string[];
  excerpts: MemoryExcerpt[];
  note?: string;
}

export interface KnowledgeSourceInfo {
  id: KnowledgeSourceId;
  description: string;
  recordCount: number;
  collecting: boolean;
  lastUpdatedLabel: string;
}

export const knowledgeSources: KnowledgeSourceInfo[] = [
  {
    id: "chat",
    description: "Text conversations with the Twin, including role selections.",
    recordCount: 3120,
    collecting: true,
    lastUpdatedLabel: "2m ago",
  },
  {
    id: "call",
    description: "Completed phone calls with outcomes and grades.",
    recordCount: 842,
    collecting: true,
    lastUpdatedLabel: "18m ago",
  },
  {
    id: "transcript",
    description: "Final utterances from calls (caller and Twin turns).",
    recordCount: 1560,
    collecting: true,
    lastUpdatedLabel: "18m ago",
  },
  {
    id: "whisper",
    description: "Operator whispers and how the Twin used them.",
    recordCount: 214,
    collecting: true,
    lastUpdatedLabel: "1h ago",
  },
  {
    id: "report",
    description: "Approved market-report scripts and drafts.",
    recordCount: 96,
    collecting: true,
    lastUpdatedLabel: "Yesterday",
  },
  {
    id: "document",
    description: "Facts extracted from uploaded reference documents.",
    recordCount: 48,
    collecting: false,
    lastUpdatedLabel: "3d ago",
  },
];

export const memories: MemoryRecord[] = [
  {
    id: "mem-1",
    title: "Explained tax-loss harvesting basics",
    source: "chat",
    kind: "conversation_pair",
    quality: "high",
    status: "pending",
    createdLabel: "Today, 09:14",
    tags: ["financial", "education", "no-figures"],
    excerpts: [
      {
        label: "User asked",
        text: "Can you explain what tax-loss harvesting is at a high level?",
      },
      {
        label: "Twin responded",
        text: "It is selling a position at a loss to offset taxable gains elsewhere, then optionally reinvesting in a similar (not identical) asset to keep market exposure. It only helps in taxable accounts.",
      },
    ],
  },
  {
    id: "mem-2",
    title: "Investor call — resolved, follow-up booked",
    source: "call",
    kind: "call_outcome",
    quality: "high",
    status: "approved",
    createdLabel: "Today, 09:20",
    tags: ["financial", "operator-twin", "outcome:resolved"],
    excerpts: [
      {
        label: "Summary",
        text: "Reviewed Q3 positioning ahead of a board call; agreed to send a one-pager and reconnect Friday.",
      },
      { label: "Outcome", text: "Resolved · follow-up scheduled" },
    ],
    note: "Clean handling, good use of the whisper. Gold candidate.",
  },
  {
    id: "mem-3",
    title: "Whisper: mention Fed meeting — woven in naturally",
    source: "whisper",
    kind: "whisper_guidance",
    quality: "high",
    status: "pending",
    createdLabel: "Today, 09:19",
    tags: ["financial", "whisper-used", "natural"],
    excerpts: [
      {
        label: "Operator whisper",
        text: "Mention Thursday's Fed meeting and how it affects our duration view.",
      },
      {
        label: "Twin line",
        text: "With the Fed meeting Thursday, we have kept duration slightly short as a hedge against a hawkish surprise.",
      },
    ],
  },
  {
    id: "mem-4",
    title: "Clarified portfolio rebalance timing",
    source: "transcript",
    kind: "conversation_pair",
    quality: "medium",
    status: "pending",
    createdLabel: "Today, 08:52",
    tags: ["financial", "process"],
    excerpts: [
      { label: "Caller asked", text: "When does the quarterly rebalance actually run?" },
      {
        label: "Twin responded",
        text: "The rebalance executes on the first business day of the quarter, after the prior month closes.",
      },
    ],
  },
  {
    id: "mem-5",
    title: "Operator tightened a verbose market summary",
    source: "chat",
    kind: "operator_edit",
    quality: "high",
    status: "approved",
    createdLabel: "Yesterday, 15:40",
    tags: ["style", "operator-twin", "conciseness"],
    excerpts: [
      {
        label: "Twin drafted",
        text: "There are a number of factors that could be contributing to the move today, including but not limited to positioning, macro data, and sentiment shifts across the market broadly.",
      },
      {
        label: "Operator revised to",
        text: "Today's move looks positioning-driven, with soft macro data as a secondary factor.",
      },
    ],
    note: "Good example of the concise response style.",
  },
  {
    id: "mem-6",
    title: "Approved: Daily Market Report script (Mar 4)",
    source: "report",
    kind: "approved_script",
    quality: "high",
    status: "approved",
    createdLabel: "Mar 4, 06:20",
    tags: ["report", "approved", "narration"],
    excerpts: [
      {
        label: "Script excerpt",
        text: "Global equities are firmer. Asian markets closed higher overnight and US index futures point to a modest gain at the open, led by technology.",
      },
    ],
  },
  {
    id: "mem-7",
    title: "Extracted: fund mandate excludes tobacco",
    source: "document",
    kind: "document_fact",
    quality: "medium",
    status: "pending",
    createdLabel: "Mar 3, 11:02",
    tags: ["compliance", "mandate"],
    excerpts: [
      { label: "Source", text: "Investment Policy Statement, page 4" },
      {
        label: "Extracted fact",
        text: "The mandate excludes direct investment in tobacco producers.",
      },
    ],
  },
  {
    id: "mem-8",
    title: "Twin gave an overly specific price target",
    source: "call",
    kind: "conversation_pair",
    quality: "low",
    status: "rejected",
    createdLabel: "Mar 3, 14:10",
    tags: ["financial", "guardrail", "no-figures"],
    excerpts: [
      { label: "Caller asked", text: "Where do you see the stock in six months?" },
      {
        label: "Twin responded",
        text: "Around $190 to $200 based on the current multiple.",
      },
    ],
    note: "Rejected — violates the 'do not commit to specific figures' guidance.",
  },
  {
    id: "mem-9",
    title: "Whisper: keep it under 30s — Twin complied",
    source: "whisper",
    kind: "whisper_guidance",
    quality: "medium",
    status: "pending",
    createdLabel: "Mar 3, 14:22",
    tags: ["style", "whisper-used", "brevity"],
    excerpts: [
      { label: "Operator whisper", text: "Keep the answer under 30 seconds." },
      {
        label: "Twin line",
        text: "Short version: energy is a small overweight, trimmed 1% last week, core position intact.",
      },
    ],
  },
  {
    id: "mem-10",
    title: "Good escalation on a legal question",
    source: "chat",
    kind: "conversation_pair",
    quality: "high",
    status: "pending",
    createdLabel: "Mar 2, 10:31",
    tags: ["guardrail", "escalation", "legal"],
    excerpts: [
      {
        label: "User asked",
        text: "Is this structure legal in our jurisdiction?",
      },
      {
        label: "Twin responded",
        text: "That is a legal question I should not answer directly. I have flagged it for the operator and counsel to review.",
      },
    ],
  },
  {
    id: "mem-11",
    title: "Missed call — voicemail transcribed",
    source: "transcript",
    kind: "call_outcome",
    quality: "low",
    status: "pending",
    createdLabel: "Mar 2, 17:22",
    tags: ["public-twin", "outcome:voicemail"],
    excerpts: [
      {
        label: "Voicemail",
        text: "Hi, this is a reporter hoping for a quick comment on the funding round. Please call back.",
      },
      { label: "Outcome", text: "Missed · voicemail · no roles engaged" },
    ],
  },
  {
    id: "mem-12",
    title: "Extracted: quarterly board meeting cadence",
    source: "document",
    kind: "document_fact",
    quality: "high",
    status: "approved",
    createdLabel: "Feb 28, 09:00",
    tags: ["operations", "calendar"],
    excerpts: [
      { label: "Source", text: "Governance handbook, section 2" },
      {
        label: "Extracted fact",
        text: "The board meets on the second Tuesday of each quarter.",
      },
    ],
  },
];

export interface TrainingStatsData {
  totalCollected: number;
  addedThisWeek: number;
  goldTarget: number;
  goldCollected: number;
  bySource: { source: KnowledgeSourceId; count: number }[];
}

export const trainingStats: TrainingStatsData = {
  totalCollected: 5980,
  addedThisWeek: 312,
  goldTarget: 5000,
  goldCollected: 1240,
  bySource: [
    { source: "chat", count: 620 },
    { source: "call", count: 410 },
    { source: "transcript", count: 90 },
    { source: "whisper", count: 88 },
    { source: "report", count: 22 },
    { source: "document", count: 10 },
  ],
};

export function getMemory(id: string): MemoryRecord | undefined {
  return memories.find((memory) => memory.id === id);
}
