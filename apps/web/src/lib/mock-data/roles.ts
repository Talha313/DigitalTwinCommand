import type { Role, RolePermission, RoleTool } from "./types";

/* Shared permission + tool definitions (CLAUDE.md vocabulary). */

const PERMISSIONS = {
  portfolioRead: {
    id: "portfolio.read",
    label: "Read portfolio",
    description: "View holdings, allocations, and performance.",
    risk: "low",
  },
  marketRead: {
    id: "market.read",
    label: "Read market data",
    description: "Access quotes, indices, and research feeds.",
    risk: "low",
  },
  alertsCreate: {
    id: "alerts.create",
    label: "Create alerts",
    description: "Set price and event alerts for the operator.",
    risk: "medium",
  },
  workflowRead: {
    id: "workflow.read",
    label: "Read workflows",
    description: "Inspect workflow definitions and run history.",
    risk: "low",
  },
  workflowExecute: {
    id: "workflow.execute",
    label: "Execute workflows",
    description: "Trigger operational workflows and automations.",
    risk: "medium",
  },
  taskCreate: {
    id: "task.create",
    label: "Create tasks",
    description: "Open tracked tasks and follow-ups.",
    risk: "medium",
  },
  socialRead: {
    id: "social.read",
    label: "Read social",
    description: "Read mentions, messages, and public sentiment.",
    risk: "low",
  },
  socialPost: {
    id: "social.post",
    label: "Publish social",
    description: "Publish public posts and statements.",
    risk: "high",
  },
  memoryPrivateRead: {
    id: "memory.private.read",
    label: "Read private memory",
    description: "Access the principal's confidential personal context.",
    risk: "medium",
  },
} satisfies Record<string, RolePermission>;

const TOOLS = {
  webSearch: {
    id: "web_search",
    name: "Web Search",
    description: "General web lookups and fact-checking.",
    risk: "low",
  },
  marketSearch: {
    id: "market_search",
    name: "Market Search",
    description: "Structured market and security research.",
    risk: "low",
  },
  portfolioApi: {
    id: "portfolio_api",
    name: "Portfolio API",
    description: "Read portfolio positions and performance.",
    risk: "medium",
  },
  workflowApi: {
    id: "workflow_api",
    name: "Workflow API",
    description: "Run and monitor operational workflows.",
    risk: "medium",
  },
  sendMessage: {
    id: "send_message",
    name: "Send Message",
    description: "Send internal messages and notifications.",
    risk: "medium",
  },
  createTask: {
    id: "create_task",
    name: "Create Task",
    description: "Create tracked tasks and reminders.",
    risk: "medium",
  },
  createAlert: {
    id: "create_alert",
    name: "Create Alert",
    description: "Configure price and event alerts.",
    risk: "medium",
  },
  socialPost: {
    id: "social_post",
    name: "Social Post",
    description: "Draft and publish public posts.",
    risk: "high",
  },
} satisfies Record<string, RoleTool>;

export const roles: Role[] = [
  {
    id: "financial",
    name: "Financial Twin",
    shortName: "Financial",
    description:
      "Handles investor and portfolio conversations with market-aware, compliance-conscious guidance.",
    personality: {
      tone: "Precise, measured, data-led",
      summary:
        "A disciplined markets analyst voice for portfolio and investor discussions.",
      traits: ["Analytical", "Direct", "Risk-aware", "Formal"],
      systemPromptPreview:
        "You are the Financial role of the Digital Twin. Speak with precision about markets, positioning, and risk. Ground claims in data and apply the standard disclaimers before any individualized guidance.",
    },
    riskLevel: "high",
    tools: [TOOLS.webSearch, TOOLS.marketSearch, TOOLS.portfolioApi, TOOLS.createAlert],
    permissions: [
      PERMISSIONS.portfolioRead,
      PERMISSIONS.marketRead,
      PERMISSIONS.alertsCreate,
    ],
    active: true,
    updatedLabel: "Updated 2 days ago",
  },
  {
    id: "operator",
    name: "Operator Twin",
    shortName: "Operator",
    description:
      "Runs internal operations — triaging requests, executing workflows, and coordinating follow-ups.",
    personality: {
      tone: "Efficient, pragmatic, action-oriented",
      summary: "An operations lead voice that turns requests into tracked actions.",
      traits: ["Organized", "Concise", "Proactive"],
      systemPromptPreview:
        "You are the Operator role of the Digital Twin. Convert requests into concrete workflow steps and tasks. Confirm scope before executing anything irreversible.",
    },
    riskLevel: "medium",
    tools: [TOOLS.workflowApi, TOOLS.createTask, TOOLS.sendMessage, TOOLS.webSearch],
    permissions: [
      PERMISSIONS.workflowRead,
      PERMISSIONS.workflowExecute,
      PERMISSIONS.taskCreate,
    ],
    active: true,
    updatedLabel: "Updated yesterday",
  },
  {
    id: "public",
    name: "Public Twin",
    shortName: "Public",
    description:
      "Speaks on public channels — social posts, media-facing statements, and general-audience Q&A.",
    personality: {
      tone: "Approachable, on-brand, careful",
      summary:
        "A public-facing communications voice for social and media touchpoints.",
      traits: ["Personable", "Brand-safe", "Measured"],
      systemPromptPreview:
        "You are the Public role of the Digital Twin. Communicate for a general audience in an approachable, on-brand voice. Anything published externally requires operator approval.",
    },
    riskLevel: "high",
    tools: [TOOLS.webSearch, TOOLS.marketSearch, TOOLS.socialPost],
    permissions: [
      PERMISSIONS.marketRead,
      PERMISSIONS.socialRead,
      PERMISSIONS.socialPost,
    ],
    active: false,
    updatedLabel: "Updated 5 days ago",
  },
  {
    id: "private",
    name: "Private Twin",
    shortName: "Private",
    description:
      "Trusted internal assistant with access to private memory for the principal's personal context.",
    personality: {
      tone: "Candid, familiar, confidential",
      summary: "A confidential assistant voice with access to private memory.",
      traits: ["Trusted", "Discreet", "Contextual"],
      systemPromptPreview:
        "You are the Private role of the Digital Twin. You may reference private memory for personal context. Never disclose private information on calls or public channels.",
    },
    riskLevel: "low",
    tools: [TOOLS.webSearch, TOOLS.portfolioApi],
    permissions: [
      PERMISSIONS.memoryPrivateRead,
      PERMISSIONS.portfolioRead,
      PERMISSIONS.marketRead,
    ],
    active: true,
    updatedLabel: "Updated 3 hours ago",
  },
];

export function getRole(id: string): Role | undefined {
  return roles.find((role) => role.id === id);
}
