"use client";

import * as React from "react";
import { MessageSquareText } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WhisperEntry } from "@/lib/mock-data/types";

import { WhisperStatusBadge } from "./transcript-message";

export interface WhisperPanelProps {
  whispers: WhisperEntry[];
  suggestions: string[];
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function WhisperPanel({
  whispers,
  suggestions,
  onSend,
  disabled = false,
}: WhisperPanelProps) {
  const [text, setText] = React.useState("");

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card">
      <div className="shrink-0 border-b border-border/60 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Whisper</p>
        <p className="text-xs text-muted-foreground">
          Private guidance injected into the Twin&apos;s next turn. The caller
          never hears it quoted.
        </p>
      </div>

      <div className="space-y-3 p-4">
        <textarea
          rows={2}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="e.g. Mention Thursday's Fed meeting."
          aria-label="Whisper instruction"
          className="w-full resize-none rounded-lg border border-border/60 bg-background/40 p-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring/60 disabled:opacity-60"
        />

        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={disabled}
              onClick={() => setText(suggestion)}
              className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          className="w-full gap-2"
          onClick={send}
          disabled={disabled || text.trim().length === 0}
        >
          <MessageSquareText className="h-4 w-4" aria-hidden />
          Send whisper
        </Button>

        {whispers.length > 0 ? (
          <ul className="space-y-2 border-t border-border/60 pt-3">
            {whispers.map((whisper) => (
              <li
                key={whisper.id}
                className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-2.5"
              >
                <p className="text-xs text-foreground">{whisper.text}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {whisper.sentAtLabel}
                  </span>
                  <WhisperStatusBadge status={whisper.status} />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
