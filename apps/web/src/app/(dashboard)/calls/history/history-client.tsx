"use client";

import * as React from "react";

import { PageContainer } from "@/components/layout/page-container";
import { CallCard } from "@/components/calls/history/call-card";
import { CallDetailsDrawer } from "@/components/calls/history/call-details-drawer";
import { CallFilters } from "@/components/calls/history/call-filters";
import { CallHistoryTable } from "@/components/calls/history/call-history-table";
import { CallSearch } from "@/components/calls/history/call-search";
import type { DirectionFilter } from "@/components/calls/history/call-filters";
import { counterpartyNumber, toUiStatus, type UiCallStatus } from "@/lib/call-history";
import { listCalls, toUiDirection, type CallRead } from "@/lib/calls";

function matchesQuery(call: CallRead, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (counterpartyNumber(call).toLowerCase().includes(q)) return true;
  if (call.from_e164?.toLowerCase().includes(q)) return true;
  if (call.to_e164?.toLowerCase().includes(q)) return true;
  if (call.summary?.toLowerCase().includes(q)) return true;
  return false;
}

export function CallHistoryClient() {
  const [calls, setCalls] = React.useState<CallRead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<UiCallStatus[]>([]);
  const [roleIds, setRoleIds] = React.useState<string[]>([]);
  const [direction, setDirection] = React.useState<DirectionFilter>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listCalls()
      .then((data) => {
        if (cancelled) return;
        setCalls(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load calls.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = calls.filter((call) => {
    if (!matchesQuery(call, query)) return false;
    if (status.length > 0 && !status.includes(toUiStatus(call.status))) return false;
    if (direction !== "all" && toUiDirection(call.direction) !== direction) return false;
    if (roleIds.length > 0 && !roleIds.some((id) => call.role_ids.includes(id))) {
      return false;
    }
    return true;
  });

  const clearFilters = () => {
    setStatus([]);
    setRoleIds([]);
    setDirection("all");
  };

  const selectedCall = selectedId
    ? calls.find((call) => call.id === selectedId) ?? null
    : null;

  return (
    <PageContainer>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">Call History</h2>
        <p className="text-sm text-muted-foreground">
          Review completed calls — transcripts, outcomes, and metadata
          retained for training.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <CallSearch value={query} onChange={setQuery} />
          <CallFilters
            status={status}
            roleIds={roleIds}
            direction={direction}
            onStatusChange={setStatus}
            onRoleIdsChange={setRoleIds}
            onDirectionChange={setDirection}
            onClear={clearFilters}
          />
        </div>
        {!loading && !error ? (
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {calls.length} calls
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
          <p className="text-sm text-muted-foreground">Loading calls…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-10 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No calls match your search and filters.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <CallHistoryTable calls={filtered} onOpen={setSelectedId} />
          </div>
          <div className="grid gap-3 md:hidden">
            {filtered.map((call) => (
              <CallCard
                key={call.id}
                call={call}
                onOpen={() => setSelectedId(call.id)}
              />
            ))}
          </div>
        </>
      )}

      <CallDetailsDrawer
        call={selectedCall}
        open={selectedCall !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </PageContainer>
  );
}
