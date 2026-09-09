import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { RiskBadge } from "@/components/roles/risk-badge";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { combinedRisk, rolesByIds } from "@/lib/role-context";
import { formatDuration } from "@/lib/format";
import type { CallHistoryEntry, CallStatus } from "@/lib/mock-data/types";

import { OutcomeBadge } from "./outcome-badge";

const STATUS_LABEL: Record<CallStatus, string> = {
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
  call: CallHistoryEntry;
}

export function CallMetadata({ call }: CallMetadataProps) {
  const roles = rolesByIds(call.roleIds);
  const DirectionIcon =
    call.direction === "inbound" ? ArrowDownLeft : ArrowUpRight;

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-border/50 bg-background/40 p-3 text-sm text-muted-foreground">
        {call.summary}
      </p>

      <dl>
        <Row label="Direction">
          <span className="inline-flex items-center gap-1.5">
            <DirectionIcon className="h-3.5 w-3.5" aria-hidden />
            {call.direction === "inbound" ? "Inbound" : "Outbound"}
          </span>
        </Row>
        <Row label="From">
          <span className="font-mono text-xs">{call.fromNumber}</span>
        </Row>
        <Row label="To">
          <span className="font-mono text-xs">{call.toNumber}</span>
        </Row>
        <Row label="Started">
          {call.dateLabel}, {call.startedAtLabel}
        </Row>
        <Row label="Duration">
          <span className="font-mono tabular-nums">
            {formatDuration(call.durationSeconds)}
          </span>
        </Row>
        <Row label="Status">{STATUS_LABEL[call.status]}</Row>
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
                <RiskBadge level={combinedRisk(call.roleIds)} showLabel={false} />
              </>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </span>
        </Row>
        <Row label="AI model">
          <span className="font-mono text-xs">{call.model}</span>
        </Row>
        <Row label="Tool calls">{call.toolCalls}</Row>
        <Row label="Whispers">{call.whispers.length}</Row>
        <Row label="Recording">
          {call.recordingAvailable ? (
            <span className="text-muted-foreground">
              Available (playback not wired)
            </span>
          ) : (
            <span className="text-muted-foreground">Not available</span>
          )}
        </Row>
        <Row label="Twilio SID">
          <span className="font-mono text-[11px] text-muted-foreground">
            {call.twilioSid}
          </span>
        </Row>
        <Row label="ElevenLabs conversation">
          <span className="font-mono text-[11px] text-muted-foreground">
            {call.elevenConversationId}
          </span>
        </Row>
      </dl>
    </div>
  );
}
