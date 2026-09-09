import type { ChatConversation } from "./types";

export const suggestedPrompts: string[] = [
  "Summarize this morning's market moves",
  "Draft a follow-up to yesterday's investor call",
  "What workflows are waiting on my approval?",
  "Prep three talking points for the earnings call",
];

/** Seed conversation shown when the chat screen first loads. */
export const chatConversation: ChatConversation = {
  id: "conv-1",
  title: "Morning briefing",
  roleIds: ["financial", "operator"],
  messages: [
    {
      id: "m1",
      author: "user",
      content: "What moved the market overnight?",
      timestamp: "09:12",
    },
    {
      id: "m2",
      author: "twin",
      roleId: "financial",
      timestamp: "09:12",
      content:
        "Asian equities closed higher and US futures are up ~0.4%. The move is led by semiconductors after stronger-than-expected guidance, with rates little changed ahead of this afternoon's data.",
      tools: [
        {
          id: "t1",
          toolId: "market_search",
          label: "Market Search",
          status: "completed",
          detail: "12 sources",
        },
      ],
    },
    {
      id: "m3",
      author: "user",
      content: "Anything I need to action today?",
      timestamp: "09:14",
    },
    {
      id: "m4",
      author: "twin",
      roleId: "operator",
      timestamp: "09:14",
      content:
        "Two items. A quarterly-report workflow is ready to run, and a client follow-up task needs your sign-off because it is flagged high-risk.",
      tools: [
        {
          id: "t2",
          toolId: "workflow_api",
          label: "Workflow API",
          status: "completed",
        },
        {
          id: "t3",
          toolId: "create_task",
          label: "Create Task",
          status: "blocked",
          detail: "Awaiting approval — high risk",
        },
      ],
    },
  ],
};

/** Canned twin replies used while no AI provider is connected. */
export const previewReplies: string[] = [
  "I'm running in UI preview mode — no AI provider is connected yet. Once the agent core is wired in, I'll answer here using the selected roles.",
  "Preview mode: your message reached the interface but was not sent to a model. The conversation layout, roles, and tool status are all live.",
  "This is a front-end preview. Real responses will stream in once Grok and the agent pipeline are connected.",
];
