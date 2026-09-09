import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AuthFooterProps {
  children: ReactNode;
  className?: string;
}

export function AuthFooter({ children, className }: AuthFooterProps) {
  return (
    <p
      className={cn(
        "mt-6 border-t border-border/60 pt-5 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
