"use client";

import * as React from "react";

import { getHealth, type HealthResponse } from "@/lib/dashboard";

/** Fetches `GET /api/health` once on mount. Used by every widget that needs
 * live system/integration status (header pill, twin status card, system
 * overview tiles) — each caller gets its own fetch since there's no
 * cross-component cache here, but the endpoint is cheap. */
export function useHealth(): {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
} {
  const [health, setHealth] = React.useState<HealthResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((res) => {
        if (!cancelled) setHealth(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load system health.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { health, loading, error };
}
