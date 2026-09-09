import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthAlertVariant = "info" | "success" | "error";

const VARIANT_STYLES: Record<AuthAlertVariant, string> = {
  info: "border-primary/30 bg-primary/10",
  success: "border-emerald-500/30 bg-emerald-500/10",
  error: "border-destructive/40 bg-destructive/10",
};

const VARIANT_ICON = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
} as const;

const VARIANT_ICON_COLOR: Record<AuthAlertVariant, string> = {
  info: "text-primary",
  success: "text-emerald-400",
  error: "text-destructive",
};

export interface AuthAlertProps {
  variant?: AuthAlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function AuthAlert({
  variant = "info",
  title,
  children,
  className,
}: AuthAlertProps) {
  const Icon = VARIANT_ICON[variant];
  const isError = variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        "mb-5 flex gap-3 rounded-lg border p-3 text-sm",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0", VARIANT_ICON_COLOR[variant])}
        aria-hidden
      />
      <div className="space-y-0.5">
        {title ? (
          <p className="font-medium text-foreground">{title}</p>
        ) : null}
        {children ? (
          <div className="text-muted-foreground">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
