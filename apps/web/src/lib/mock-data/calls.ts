import type { CallRecord } from "./types";

export const recentCalls: CallRecord[] = [
  {
    id: "c1",
    caller: "John Smith",
    role: "Financial Twin",
    duration: "12:35",
    status: "completed",
    date: "Today",
  },
  {
    id: "c2",
    caller: "Sarah Lin",
    role: "Operator Twin",
    duration: "04:12",
    status: "completed",
    date: "Today",
  },
  {
    id: "c3",
    caller: "Unknown (+1 415 555 0148)",
    role: "Public Twin",
    duration: "00:38",
    status: "missed",
    date: "Today",
  },
  {
    id: "c4",
    caller: "David Okafor",
    role: "Financial Twin",
    duration: "21:07",
    status: "completed",
    date: "Yesterday",
  },
  {
    id: "c5",
    caller: "Priya Nair",
    role: "Operator Twin",
    duration: "02:44",
    status: "in-progress",
    date: "Yesterday",
  },
];

/* ---------------------------------------------------------------------------
 * Live call — seed data for the Live Call screen (UI preview only)
 * ------------------------------------------------------------------------- */

export const liveCall: import("./types").LiveCall = {
  id: "call-live-1",
  participant: {
    name: "Marcus Webb",
    number: "+1 (415) 555-0142",
    direction: "inbound",
    company: "Redpoint Capital",
    location: "San Francisco, CA",
  },
  roleIds: ["financial"],
  transcript: [
    {
      id: "u1",
      speaker: "caller",
      text: "Hi — I wanted to walk through Q3 positioning before the board call.",
      timestamp: "00:04",
    },
    {
      id: "u2",
      speaker: "twin",
      text: "Of course. The portfolio is up 2.1% quarter-to-date, mostly from the technology overweight. I can take you through the drivers.",
      timestamp: "00:12",
    },
    {
      id: "u3",
      speaker: "whisper",
      text: "Mention Thursday's Fed meeting and how it affects our duration view.",
      timestamp: "00:19",
      whisperStatus: "spoken",
    },
    {
      id: "u4",
      speaker: "twin",
      text: "One thing to flag: with the Fed meeting Thursday, we have kept duration slightly short as a hedge against a hawkish surprise.",
      timestamp: "00:25",
    },
    {
      id: "u5",
      speaker: "caller",
      text: "Good. And the energy names — still overweight there?",
      timestamp: "00:33",
    },
  ],
};

export const suggestedWhispers: string[] = [
  "Keep the answer under 30 seconds.",
  "Mention Thursday's Fed meeting.",
  "Steer toward booking a follow-up.",
  "Do not commit to specific figures.",
];
