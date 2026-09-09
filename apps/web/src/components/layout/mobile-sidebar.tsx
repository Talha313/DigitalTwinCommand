"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Waypoints } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { NAV_ITEMS, isActivePath } from "./nav-items";

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0" aria-describedby={undefined}>
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border/60 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-500">
            <Waypoints className="h-5 w-5 text-primary-foreground" aria-hidden />
          </span>
          <SheetTitle className="flex flex-col text-left leading-tight">
            <span className="text-sm font-semibold text-foreground">
              Digital Twin
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Command Center
            </span>
          </SheetTitle>
        </div>
        <nav aria-label="Primary" className="space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn("h-5 w-5 shrink-0", active && "text-primary")}
                  aria-hidden
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
