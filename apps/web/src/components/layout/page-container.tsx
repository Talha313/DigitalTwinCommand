import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="space-y-4 lg:space-y-6">{children}</div>
    </div>
  );
}
