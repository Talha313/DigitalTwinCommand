import {
  BellPlus,
  CheckSquare,
  Globe,
  Search,
  Send,
  Share2,
  Wallet,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const TOOL_ICON: Record<string, LucideIcon> = {
  web_search: Globe,
  market_search: Search,
  portfolio_api: Wallet,
  workflow_api: Workflow,
  send_message: Send,
  create_task: CheckSquare,
  create_alert: BellPlus,
  social_post: Share2,
};

/** Icon for a tool id, with a neutral fallback. Shared by Roles and Chat. */
export function toolIcon(id: string): LucideIcon {
  return TOOL_ICON[id] ?? Wrench;
}
