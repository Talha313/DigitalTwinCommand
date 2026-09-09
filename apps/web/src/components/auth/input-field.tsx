import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  /** Optional element rendered on the right of the label row (e.g. a link). */
  labelAction?: React.ReactNode;
  containerClassName?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
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

        <Input
          ref={ref}
          id={fieldId}
          name={name}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={className}
          {...props}
        />

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
InputField.displayName = "InputField";
