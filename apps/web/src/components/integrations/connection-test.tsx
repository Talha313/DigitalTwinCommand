"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Plug, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Integration } from "@/lib/mock-data/integrations";

type TestState = "idle" | "testing" | "ok" | "fail";

export interface ConnectionTestProps {
  integration: Integration;
}

export function ConnectionTest({ integration }: ConnectionTestProps) {
  const [state, setState] = React.useState<TestState>("idle");
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setState("idle");
  }, [integration.id]);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const run = () => {
    setState("testing");
    timerRef.current = setTimeout(() => {
      setState(integration.status === "connected" ? "ok" : "fail");
    }, 1100);
  };

  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Connection test</p>
          <p className="text-xs text-muted-foreground">
            Simulated — no request is sent to {integration.name}.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={run}
          disabled={state === "testing"}
          className="shrink-0 gap-1.5"
        >
          {state === "testing" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Plug className="h-3.5 w-3.5" aria-hidden />
          )}
          {state === "testing" ? "Testing" : "Test connection"}
        </Button>
      </div>

      {state === "ok" ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Reached {integration.name} · 142&nbsp;ms (simulated)
        </p>
      ) : null}
      {state === "fail" ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1.5 text-xs font-medium",
            integration.status === "not_configured"
              ? "text-muted-foreground"
              : "text-amber-300",
          )}
        >
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
          {integration.statusDetail} Save credentials first.
        </p>
      ) : null}
    </div>
  );
}
