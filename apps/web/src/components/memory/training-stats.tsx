import { CheckCheck, Clock, Database } from "lucide-react";

import { cn } from "@/lib/utils";
import { SOURCE_LABEL, type MemorySourceType } from "@/lib/memory";

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
  total: number;
  pending: number;
  approved: number;
  bySource: { source: MemorySourceType; count: number }[];
  className?: string;
}

/** Real counts derived from the fetched memory list. The mock's
 * "gold dataset target" concept has no backend equivalent — dropped rather
 * than faked. */
export function TrainingStats({
  total,
  pending,
  approved,
  bySource,
  className,
}: TrainingStatsProps) {
  const maxSource = Math.max(...bySource.map((entry) => entry.count), 1);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile
          icon={Database}
          label="Total records"
          value={NUMBER_FORMAT.format(total)}
          detail="Across all sources"
        />
        <Tile
          icon={Clock}
          label="Awaiting review"
          value={NUMBER_FORMAT.format(pending)}
        />
        <Tile
          icon={CheckCheck}
          label="Approved"
          value={NUMBER_FORMAT.format(approved)}
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-medium text-foreground">Records by source</p>
        <ul className="mt-3 space-y-2">
          {bySource.map((entry) => (
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
