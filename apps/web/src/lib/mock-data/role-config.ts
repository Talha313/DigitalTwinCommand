import type { RiskLevel } from "./types";
import { getRole } from "./roles";

/* ---------------------------------------------------------------------------
 * Tone / personality options
 * ------------------------------------------------------------------------- */

export type ToneId =
  | "formal"
  | "professional"
  | "warm"
  | "direct"
  | "casual";

export interface ToneOption {
  id: ToneId;
  label: string;
  description: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  {
    id: "formal",
    label: "Formal",
    description: "Precise, structured, no contractions. Best for compliance-sensitive contexts.",
  },
  {
    id: "professional",
    label: "Professional",
    description: "Clear and businesslike with a measured, confident register.",
  },
  {
    id: "warm",
    label: "Warm",
    description: "Approachable and personable while staying credible.",
  },
  {
    id: "direct",
    label: "Direct",
    description: "Short sentences, leads with the answer, minimal hedging.",
  },
  {
    id: "casual",
    label: "Casual",
    description: "Relaxed and conversational. Reserve for internal or low-stakes calls.",
  },
];

export type ResponseStyleId = "concise" | "balanced" | "detailed";

export interface ResponseStyleOption {
  id: ResponseStyleId;
  label: string;
  description: string;
}

export const RESPONSE_STYLE_OPTIONS: ResponseStyleOption[] = [
  {
    id: "concise",
    label: "Concise",
    description: "One or two sentences. Expands only when asked.",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "A short answer plus the key supporting context.",
  },
  {
    id: "detailed",
    label: "Detailed",
    description: "Full reasoning, caveats, and next steps.",
  },
];

export interface BehaviorPreference {
  id: string;
  label: string;
  description: string;
}

export const BEHAVIOR_PREFERENCES: BehaviorPreference[] = [
  {
    id: "suggest_next_steps",
    label: "Proactively suggest next steps",
    description: "Offer a concrete follow-up action at the end of a response.",
  },
  {
    id: "confirm_irreversible",
    label: "Confirm before irreversible actions",
    description: "Ask for explicit confirmation before anything that cannot be undone.",
  },
  {
    id: "cite_sources",
    label: "Cite sources",
    description: "Name the tool or document a fact came from.",
  },
  {
    id: "mirror_formality",
    label: "Mirror the caller's formality",
    description: "Match the caller's register within the configured tone.",
  },
  {
    id: "escalate_when_uncertain",
    label: "Escalate when uncertain",
    description: "Hand off to the operator rather than guessing on high-stakes questions.",
  },
];

/* ---------------------------------------------------------------------------
 * Permission catalog (full set — the role grants a subset)
 * ------------------------------------------------------------------------- */

export type PermissionCategory =
  | "data"
  | "alerts"
  | "workflow"
  | "social"
  | "memory";

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  "data",
  "alerts",
  "workflow",
  "social",
  "memory",
];

export const PERMISSION_CATEGORY_LABEL: Record<PermissionCategory, string> = {
  data: "Data",
  alerts: "Alerts",
  workflow: "Workflow & tasks",
  social: "Social",
  memory: "Memory",
};

export interface PermissionCatalogItem {
  id: string;
  label: string;
  description: string;
  category: PermissionCategory;
  risk: RiskLevel;
}

export const PERMISSION_CATALOG: PermissionCatalogItem[] = [
  {
    id: "portfolio.read",
    label: "Read portfolio",
    description: "View holdings, allocations, and performance.",
    category: "data",
    risk: "low",
  },
  {
    id: "market.read",
    label: "Read market data",
    description: "Access quotes, indices, and research feeds.",
    category: "data",
    risk: "low",
  },
  {
    id: "alerts.create",
    label: "Create alerts",
    description: "Set price and event alerts for the operator.",
    category: "alerts",
    risk: "medium",
  },
  {
    id: "workflow.read",
    label: "Read workflows",
    description: "Inspect workflow definitions and run history.",
    category: "workflow",
    risk: "low",
  },
  {
    id: "workflow.execute",
    label: "Execute workflows",
    description: "Trigger operational workflows and automations.",
    category: "workflow",
    risk: "medium",
  },
  {
    id: "task.create",
    label: "Create tasks",
    description: "Open tracked tasks and follow-ups.",
    category: "workflow",
    risk: "medium",
  },
  {
    id: "social.read",
    label: "Read social",
    description: "Read mentions, messages, and public sentiment.",
    category: "social",
    risk: "low",
  },
  {
    id: "social.post",
    label: "Publish social",
    description: "Publish public posts and statements.",
    category: "social",
    risk: "high",
  },
  {
    id: "memory.private.read",
    label: "Read private memory",
    description: "Access the principal's confidential personal context.",
    category: "memory",
    risk: "medium",
  },
];

/* ---------------------------------------------------------------------------
 * Tool / API catalog
 * ------------------------------------------------------------------------- */

export interface ToolCatalogItem {
  id: string;
  name: string;
  description: string;
  risk: RiskLevel;
  requiresPermission?: string;
}

export const TOOL_CATALOG: ToolCatalogItem[] = [
  {
    id: "market_search",
    name: "Market API",
    description: "Structured market and security research.",
    risk: "low",
    requiresPermission: "market.read",
  },
  {
    id: "portfolio_api",
    name: "Portfolio API",
    description: "Read portfolio positions and performance.",
    risk: "medium",
    requiresPermission: "portfolio.read",
  },
  {
    id: "workflow_api",
    name: "Workflow API",
    description: "Run and monitor operational workflows.",
    risk: "medium",
    requiresPermission: "workflow.execute",
  },
  {
    id: "send_message",
    name: "Messaging API",
    description: "Send internal messages and notifications.",
    risk: "medium",
  },
  {
    id: "web_search",
    name: "Web Search",
    description: "General web lookups and fact-checking.",
    risk: "low",
  },
  {
    id: "create_task",
    name: "Task API",
    description: "Create tracked tasks and reminders.",
    risk: "medium",
    requiresPermission: "task.create",
  },
  {
    id: "create_alert",
    name: "Alert API",
    description: "Configure price and event alerts.",
    risk: "medium",
    requiresPermission: "alerts.create",
  },
  {
    id: "social_post",
    name: "Social API",
    description: "Draft and publish public posts.",
    risk: "high",
    requiresPermission: "social.post",
  },
];

/* ---------------------------------------------------------------------------
 * Draft config assembled from a role
 * ------------------------------------------------------------------------- */

export interface RoleConfigDraft {
  roleId: string;
  roleName: string;
  tone: ToneId;
  responseStyle: ResponseStyleId;
  behaviorPreferences: string[];
  riskLevel: RiskLevel;
  permissionIds: string[];
  toolIds: string[];
}

const TONE_BY_ROLE: Record<string, ToneId> = {
  financial: "formal",
  operator: "direct",
  public: "professional",
  private: "warm",
};

const STYLE_BY_ROLE: Record<string, ResponseStyleId> = {
  financial: "detailed",
  operator: "concise",
  public: "balanced",
  private: "balanced",
};

const PREFS_BY_ROLE: Record<string, string[]> = {
  financial: ["confirm_irreversible", "cite_sources", "escalate_when_uncertain"],
  operator: ["suggest_next_steps", "confirm_irreversible"],
  public: ["confirm_irreversible", "mirror_formality"],
  private: ["cite_sources", "mirror_formality"],
};

export function getRoleConfig(roleId: string): RoleConfigDraft | null {
  const role = getRole(roleId);
  if (!role) return null;
  return {
    roleId: role.id,
    roleName: role.name,
    tone: TONE_BY_ROLE[role.id] ?? "professional",
    responseStyle: STYLE_BY_ROLE[role.id] ?? "balanced",
    behaviorPreferences:
      PREFS_BY_ROLE[role.id] ?? ["confirm_irreversible", "cite_sources"],
    riskLevel: role.riskLevel,
    permissionIds: role.permissions.map((permission) => permission.id),
    toolIds: role.tools.map((tool) => tool.id),
  };
}
