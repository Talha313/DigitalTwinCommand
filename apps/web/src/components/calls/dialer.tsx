"use client";

import * as React from "react";
import { Delete, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import type { CallParticipant } from "@/lib/mock-data/types";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

export interface DialerProps {
  onDial: (number: string) => void;
  lastCall?: { participant: CallParticipant; seconds: number } | null;
}

export function Dialer({ onDial, lastCall = null }: DialerProps) {
  const [number, setNumber] = React.useState("");

  const press = (key: string) => setNumber((current) => `${current}${key}`.slice(0, 18));

  return (
    <div className="w-full max-w-sm rounded-xl border border-border/60 bg-card p-6">
      {lastCall ? (
        <div className="mb-4 rounded-lg border border-border/50 bg-background/40 p-3 text-xs text-muted-foreground">
          Last call · {lastCall.participant.name} ·{" "}
          <span className="font-mono">{formatDuration(lastCall.seconds)}</span>
        </div>
      ) : null}

      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Outbound call
      </p>
      <input
        value={number}
        onChange={(event) =>
          setNumber(event.target.value.replace(/[^\d*#+]/g, "").slice(0, 18))
        }
        placeholder="+1 (555) 000-0000"
        aria-label="Phone number"
        inputMode="tel"
        className="mt-2 w-full bg-transparent text-center font-mono text-2xl tracking-wide text-foreground outline-none placeholder:text-muted-foreground/40"
      />

      <div className="mt-4 grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            className="rounded-lg border border-border/50 bg-background/40 py-3 text-lg font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {key}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setNumber((current) => current.slice(0, -1))}
          disabled={number.length === 0}
          aria-label="Delete last digit"
        >
          <Delete className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={() => onDial(number)}
          disabled={number.length < 3}
        >
          <Phone className="h-4 w-4" aria-hidden />
          Call
        </Button>
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Enter a phone number to start a call.
      </p>
    </div>
  );
}
