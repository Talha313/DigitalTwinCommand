import { CalendarPlus, Database, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SOURCE_LABEL,
  type TrainingStatsData,
} from "@/lib/mock-data/memory";

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

function Tile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/60">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-semibold text-foreground">{value}</p>
        {detail ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

export interface TrainingStatsProps {
  stats: TrainingStatsData;
  className?: string;
}

export function TrainingStats({ stats, className }: TrainingStatsProps) {
  const goldPct = Math.min(
    100,
    Math.round((stats.goldCollected / stats.goldTarget) * 100),
  );
  const maxSource = Math.max(...stats.bySource.map((entry) => entry.count), 1);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile
          icon={Database}
          label="Records collected"
          value={NUMBER_FORMAT.format(stats.totalCollected)}
          detail="Across all knowledge sources"
        />
        <Tile
          icon={CalendarPlus}
          label="Added this week"
          value={`+${NUMBER_FORMAT.format(stats.addedThisWeek)}`}
        />
        <Tile
          icon={Sparkles}
          label="Gold dataset"
          value={`${NUMBER_FORMAT.format(stats.goldCollected)} / ${NUMBER_FORMAT.format(stats.goldTarget)}`}
          detail={`${goldPct}% of target`}
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            Gold dataset readiness
          </p>
          <span className="text-xs text-muted-foreground">{goldPct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${goldPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          LoRA fine-tuning of an owned model begins once the gold dataset is
          complete. Not enabled in V1 — Grok remains the reasoning engine.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-medium text-foreground">
          Gold-eligible records by source
        </p>
        <ul className="mt-3 space-y-2">
          {stats.bySource.map((entry) => (
            <li key={entry.source} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">
                {SOURCE_LABEL[entry.source]}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary/70"
                  style={{ width: `${(entry.count / maxSource) * 100}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right text-xs tabular-nums text-foreground">
                {entry.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
