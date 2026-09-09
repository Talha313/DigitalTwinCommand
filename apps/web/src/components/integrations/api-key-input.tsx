"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ApiKeyInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  secret?: boolean;
  required?: boolean;
  hint?: string;
  configured?: boolean;
  maskedPreview?: string;
  savedValue?: string;
}

export function ApiKeyInput({
  label,
  name,
  value,
  onChange,
  secret = false,
  required = false,
  hint,
  configured = false,
  maskedPreview,
  savedValue,
}: ApiKeyInputProps) {
  const [revealed, setRevealed] = React.useState(false);
  const hintId = `${name}-hint`;
  const untouched = value.length === 0;

  const placeholder = configured
    ? secret
      ? (maskedPreview ?? "Saved — enter a new value to replace")
      : (savedValue ?? "Saved")
    : secret
      ? "Paste key"
      : "Enter value";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={name}>
          {label}
          {required ? (
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          ) : null}
        </Label>
        {configured && untouched ? (
          <span className="text-[11px] font-medium text-emerald-300">Saved</span>
        ) : null}
      </div>

      <div className="relative">
        <Input
          id={name}
          name={name}
          type={secret && !revealed ? "password" : "text"}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-describedby={hint ? hintId : undefined}
          className={cn("font-mono text-sm", secret && "pr-10")}
        />
        {secret ? (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? "Hide value" : "Show value"}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
