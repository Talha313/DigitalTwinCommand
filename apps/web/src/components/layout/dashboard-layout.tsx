"use client";

import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { RolesProvider } from "@/lib/role-context";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./use-sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RolesProvider>
      <SidebarProvider>
        <TooltipProvider delayDuration={200}>
          <div className="flex h-full w-full overflow-hidden bg-background">
            <Sidebar className="hidden md:flex" />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                {children}
              </main>
            </div>
          </div>
        </TooltipProvider>
      </SidebarProvider>
    </RolesProvider>
  );
}
