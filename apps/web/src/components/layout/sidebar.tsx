"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, Waypoints } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { NAV_ITEMS, isActivePath } from "./nav-items";
import { useSidebar } from "./use-sidebar";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "flex h-svh flex-col border-r border-border/60 bg-card/40 transition-[width] duration-200 ease-out",
        collapsed ? "w-[4.5rem]" : "w-64",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-border/60 px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-500">
            <Waypoints className="h-5 w-5 text-primary-foreground" aria-hidden />
          </span>
          {!collapsed ? (
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">
                Digital Twin
              </span>
              <span className="text-xs text-muted-foreground">
                Command Center
              </span>
            </span>
          ) : null}
        </Link>
      </div>

      <nav
        aria-label="Primary"
        className="flex-1 space-y-1 overflow-y-auto p-3"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const link = (
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon
                className={cn(
                  "h-[1.15rem] w-[1.15rem] shrink-0",
                  active && "text-primary",
                )}
                aria-hidden
              />
              <span className={cn("truncate", collapsed && "sr-only")}>
                {item.label}
              </span>
              {active && !collapsed ? (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            <div key={item.href}>{link}</div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border/60 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-full text-muted-foreground",
            collapsed ? "justify-center px-0" : "justify-start",
          )}
        >
          <ChevronsLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            aria-hidden
          />
          {!collapsed ? <span>Collapse</span> : null}
        </Button>
      </div>
    </aside>
  );
}
