import type { SystemMetric, TwinSnapshot } from "./types";

export const twinSnapshot: TwinSnapshot = {
  status: "online",
  mode: "listening",
  roles: [
    { id: "financial", name: "Financial Twin" },
    { id: "operator", name: "Operator Twin" },
  ],
  voice: "connected",
  aiEngine: "ready",
};

export const systemMetrics: SystemMetric[] = [
  {
    id: "voice",
    label: "Voice service",
    value: "Connected",
    detail: "ElevenLabs",
    state: "connected",
    tone: "positive",
  },
  {
    id: "ai-model",
    label: "AI model",
    value: "Ready",
    detail: "xAI Grok",
    state: "ready",
    tone: "positive",
  },
  {
    id: "calls-today",
    label: "Calls today",
    value: "8",
    detail: "2 in progress",
  },
  {
    id: "reports-generated",
    label: "Reports generated",
    value: "3",
    detail: "This week",
  },
];
