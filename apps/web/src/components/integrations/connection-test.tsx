"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Plug, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import {
  testConnection,
  type ConnectionTestResult,
  type IntegrationRead,
} from "@/lib/integrations";

type TestState = "idle" | "testing" | "ok" | "fail";

export interface ConnectionTestProps {
  integration: IntegrationRead;
  /** Fired with the (possibly changed) status after a real test runs. */
  onTested?: (result: ConnectionTestResult) => void;
}

export function ConnectionTest({ integration, onTested }: ConnectionTestProps) {
  const [state, setState] = React.useState<TestState>("idle");
  const [detail, setDetail] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setState("idle");
    setDetail(null);
    setError(null);
  }, [integration.id]);

  const run = async () => {
    setState("testing");
    setError(null);
    try {
      const result = await testConnection(integration.id);
      setDetail(result.detail);
      setState(result.ok ? "ok" : "fail");
      onTested?.(result);
    } catch (err) {
      setState("fail");
      setDetail(null);
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not run the connection test.",
      );
    }
  };

  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Connection test</p>
          <p className="text-xs text-muted-foreground">
            Sends a real request to {integration.name}.
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
          {detail ?? `Reached ${integration.name}.`}
        </p>
      ) : null}
      {state === "fail" ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1.5 text-xs font-medium",
            error ? "text-destructive" : "text-amber-300",
          )}
        >
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
          {error ?? detail ?? "Connection failed."}
        </p>
      ) : null}
    </div>
  );
}
