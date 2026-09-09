import type { ElementType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DashboardCardProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  as?: ElementType;
}

/** Shared panel used by every dashboard section for a consistent shell. */
export function DashboardCard({
  title,
  description,
  icon: Icon,
  action,
  footer,
  children,
  className,
  contentClassName,
  as: Tag = "section",
}: DashboardCardProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <Tag
      className={cn(
        "flex flex-col rounded-xl border border-border/60 bg-card shadow-sm",
        className,
      )}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
          <div className="flex items-start gap-3">
            {Icon ? (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
              </span>
            ) : null}
            <div className="space-y-0.5">
              {title ? (
                <h3 className="text-sm font-semibold text-foreground">
                  {title}
                </h3>
              ) : null}
              {description ? (
                <p className="text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      <div className={cn("flex-1 p-5", contentClassName)}>{children}</div>

      {footer ? (
        <div className="border-t border-border/60 px-5 py-3 text-sm">
          {footer}
        </div>
      ) : null}
    </Tag>
  );
}
