import {
  BrainCircuit,
  History,
  LayoutDashboard,
  MessagesSquare,
  PhoneCall,
  Settings,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Single source of truth for primary navigation (desktop + mobile). */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chat", href: "/chat", icon: MessagesSquare },
  { label: "Live Calls", href: "/calls/live", icon: PhoneCall },
  { label: "Call History", href: "/calls/history", icon: History },
  { label: "Reports", href: "/reports", icon: SlidersHorizontal },
  { label: "Memory", href: "/memory", icon: BrainCircuit },
  { label: "Roles", href: "/roles", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
