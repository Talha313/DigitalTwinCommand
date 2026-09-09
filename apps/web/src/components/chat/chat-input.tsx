"use client";

import * as React from "react";
import { SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

import { VoiceButton } from "./voice-button";

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (value: string) => void;
  disabled?: boolean;
  roleCount: number;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  roleCount,
}: ChatInputProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const submit = () => {
    if (disabled || value.trim().length === 0) return;
    onSend(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="shrink-0 border-t border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-card p-2 focus-within:border-ring/60">
          <VoiceButton />
          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Message the Digital Twin&hellip;"
            aria-label="Message the Digital Twin"
            className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={disabled || value.trim().length === 0}
            aria-label="Send message"
            className="h-9 w-9 shrink-0"
          >
            <SendHorizontal className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
          {roleCount > 0
            ? `Replying with ${roleCount} role${roleCount > 1 ? "s" : ""}`
            : "Select at least one role"}
          {" · Enter to send, Shift+Enter for a new line · UI preview"}
        </p>
      </div>
    </div>
  );
}
