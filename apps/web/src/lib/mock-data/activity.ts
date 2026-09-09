import type { ActivityEntry } from "./types";

export const recentActivity: ActivityEntry[] = [
  { id: "a1", time: "10:45", title: "Investor call completed", kind: "call" },
  {
    id: "a2",
    time: "10:30",
    title: "Daily market report generated",
    kind: "report",
  },
  {
    id: "a3",
    time: "10:15",
    title: "Financial role assigned to session",
    kind: "role",
  },
  { id: "a4", time: "09:58", title: "Voice service reconnected", kind: "voice" },
  {
    id: "a5",
    time: "09:40",
    title: "AI engine warm-up complete",
    kind: "system",
  },
];
