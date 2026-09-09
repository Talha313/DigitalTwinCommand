"use client";

import * as React from "react";
import { Mic, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Voice-input placeholder. Toggles a visual listening state only. */
export function VoiceButton() {
  const [listening, setListening] = React.useState(false);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setListening((value) => !value)}
          aria-pressed={listening}
          aria-label={listening ? "Stop voice input" : "Start voice input"}
          className={cn(
            "h-9 w-9 shrink-0",
            listening && "text-primary ring-1 ring-primary/40",
          )}
        >
          {listening ? (
            <Square className="h-4 w-4" aria-hidden />
          ) : (
            <Mic className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Voice input — coming soon</TooltipContent>
    </Tooltip>
  );
}
