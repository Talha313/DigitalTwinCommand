"use client";

import * as React from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  labelAction?: React.ReactNode;
  containerClassName?: string;
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(
  (
    {
      label,
      name,
      error,
      hint,
      labelAction,
      className,
      containerClassName,
      id,
      required,
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(false);
    const fieldId = id ?? name;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;
    const describedBy =
      [error ? errorId : null, hint && !error ? hintId : null]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={fieldId}>
            {label}
            {required ? (
              <span className="ml-0.5 text-destructive" aria-hidden>
                *
              </span>
            ) : null}
          </Label>
          {labelAction ? (
            <span className="text-xs">{labelAction}</span>
          ) : null}
        </div>

        <div className="relative">
          <Input
            ref={ref}
            id={fieldId}
            name={name}
            type={visible ? "text" : "password"}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn("pr-10", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {visible ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>

        {hint && !error ? (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-destructive"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
