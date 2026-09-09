import { Activity, Mic, Radio, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusDot, type StatusTone } from "@/components/ui/status-dot";
import { twinSnapshot } from "@/lib/mock-data/dashboard";
import type { ServiceState, TwinSnapshot } from "@/lib/mock-data/types";

import { DashboardCard } from "./dashboard-card";
import { RoleBadge } from "./role-badge";

const MODE_LABEL: Record<TwinSnapshot["mode"], string> = {
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  idle: "Idle",
};

const SERVICE_LABEL: Record<ServiceState, string> = {
  connected: "Connected",
  ready: "Ready",
  disconnected: "Disconnected",
  error: "Error",
};

function serviceTone(state: ServiceState): StatusTone {
  if (state === "connected" || state === "ready") return "positive";
  if (state === "disconnected") return "warning";
  return "critical";
}

interface FieldProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: StatusTone;
}

function Field({ icon: Icon, label, value, tone }: FieldProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
        {tone ? <StatusDot tone={tone} /> : null}
        {value}
      </p>
    </div>
  );
}

export function TwinStatusCard({
  snapshot = twinSnapshot,
  className,
}: {
  snapshot?: TwinSnapshot;
  className?: string;
}) {
  const online = snapshot.status === "online";

  return (
    <DashboardCard
      className={className}
      title="Digital Twin"
      description="Live operational state"
      icon={Sparkles}
      action={
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-2.5 py-1 text-xs font-medium text-foreground">
          <StatusDot tone={online ? "positive" : "critical"} pulse={online} />
          {online ? "Online" : "Offline"}
        </span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field icon={Activity} label="Current mode" value={MODE_LABEL[snapshot.mode]} />
        <Field
          icon={Mic}
          label="Voice"
          value={SERVICE_LABEL[snapshot.voice]}
          tone={serviceTone(snapshot.voice)}
        />
        <Field
          icon={Sparkles}
          label="AI engine"
          value={SERVICE_LABEL[snapshot.aiEngine]}
          tone={serviceTone(snapshot.aiEngine)}
        />
        <Field
          icon={Radio}
          label="Session"
          value={online ? "Active" : "Idle"}
          tone={online ? "positive" : "neutral"}
        />
      </div>

      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Active roles
        </p>
        <div className="flex flex-wrap gap-2">
          {snapshot.roles.map((role) => (
            <RoleBadge key={role.id} name={role.name} />
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
