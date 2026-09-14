"use client";

import { usePathname } from "next/navigation";

import { StatusDot } from "@/components/ui/status-dot";
import { useHealth } from "@/hooks/use-health";

import { MobileSidebar } from "./mobile-sidebar";
import { NAV_ITEMS, isActivePath } from "./nav-items";
import { NotificationMenu } from "./notification-menu";
import { UserMenu } from "./user-menu";

function useCurrentPageTitle(): string {
  const pathname = usePathname();
  const match = NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
  return match?.label ?? "Command Center";
}

export function Header() {
  const title = useCurrentPageTitle();
  const { health, loading } = useHealth();
  const online = health?.status === "ok";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <MobileSidebar />

      <div className="min-w-0 flex-1">
        <p
          className="hidden text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:block"
          aria-hidden
        >
          Command Center / {title}
        </p>
        <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground sm:inline-flex">
          <StatusDot tone={online ? "positive" : "critical"} pulse={online} />
          {loading ? "Checking…" : online ? "AI Online" : "AI Degraded"}
        </span>
        <NotificationMenu />
        <UserMenu />
      </div>
    </header>
  );
}
