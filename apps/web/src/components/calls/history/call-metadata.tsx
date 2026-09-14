"use client";

import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { RiskBadge } from "@/components/roles/risk-badge";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { useCombinedRisk, useRolesByIds } from "@/lib/role-context";
import { formatDuration } from "@/lib/format";
import {
  callTimestamp,
  formatCallTimestamp,
  toUiStatus,
  type UiCallStatus,
} from "@/lib/call-history";
import { recordingUrl, toUiDirection, type CallRead } from "@/lib/calls";

import { OutcomeBadge } from "./outcome-badge";

const STATUS_LABEL: Record<UiCallStatus, string> = {
  completed: "Completed",
  missed: "Missed",
  "in-progress": "In progress",
  failed: "Failed",
};

function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/40 py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground sm:text-right">
        {children}
      </dd>
    </div>
  );
}

export interface CallMetadataProps {
  call: CallRead;
}

export function CallMetadata({ call }: CallMetadataProps) {
  const roles = useRolesByIds(call.role_ids);
  const combinedRiskLevel = useCombinedRisk(call.role_ids);
  const direction = toUiDirection(call.direction);
  const DirectionIcon = direction === "inbound" ? ArrowDownLeft : ArrowUpRight;

  return (
    <div className="space-y-4">
      {call.summary ? (
        <p className="rounded-lg border border-border/50 bg-background/40 p-3 text-sm text-muted-foreground">
          {call.summary}
        </p>
      ) : null}

      <dl>
        <Row label="Direction">
          <span className="inline-flex items-center gap-1.5">
            <DirectionIcon className="h-3.5 w-3.5" aria-hidden />
            {direction === "inbound" ? "Inbound" : "Outbound"}
          </span>
        </Row>
        <Row label="From">
          <span className="font-mono text-xs">{call.from_e164 ?? "—"}</span>
        </Row>
        <Row label="To">
          <span className="font-mono text-xs">{call.to_e164 ?? "—"}</span>
        </Row>
        <Row label="Started">{formatCallTimestamp(callTimestamp(call))}</Row>
        <Row label="Duration">
          <span className="font-mono tabular-nums">
            {formatDuration(call.duration_seconds ?? 0)}
          </span>
        </Row>
        <Row label="Status">{STATUS_LABEL[toUiStatus(call.status)]}</Row>
        <Row label="Outcome">
          <OutcomeBadge outcome={call.outcome} />
        </Row>
        <Row label="Roles">
          <span className="flex flex-wrap justify-end gap-1.5">
            {roles.length > 0 ? (
              <>
                {roles.map((role) => (
                  <RoleBadge key={role.id} name={role.name} />
                ))}
                <RiskBadge level={combinedRiskLevel} showLabel={false} />
              </>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </span>
        </Row>
        <Row label="AI model">
          <span className="font-mono text-xs">{call.model ?? "—"}</span>
        </Row>
        <Row label="Tool calls">{call.tool_call_count}</Row>
        <Row label="Recording">
          {call.recording_url ? (
            <audio
              controls
              preload="none"
              crossOrigin="use-credentials"
              src={recordingUrl(call.id)}
              className="h-8 w-full sm:w-64"
            />
          ) : (
            <span className="text-muted-foreground">Not available</span>
          )}
        </Row>
        <Row label="Twilio SID">
          <span className="font-mono text-[11px] text-muted-foreground">
            {call.twilio_sid ?? "—"}
          </span>
        </Row>
        <Row label="ElevenLabs conversation">
          <span className="font-mono text-[11px] text-muted-foreground">
            {call.eleven_conversation_id ?? "—"}
          </span>
        </Row>
      </dl>
    </div>
  );
}
