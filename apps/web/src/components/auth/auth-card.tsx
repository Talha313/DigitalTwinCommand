import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border/70 bg-card/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8",
        "animate-fade-in",
        className,
      )}
    >
      {children}
    </div>
  );
}
