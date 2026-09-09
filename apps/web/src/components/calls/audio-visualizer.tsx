import { cn } from "@/lib/utils";

const BAR_DELAYS = [0, 120, 240, 90, 200, 60, 160];

export interface AudioVisualizerProps {
  /** Animate the bars when true; render a flat idle state otherwise. */
  active?: boolean;
  tone?: "caller" | "twin" | "idle";
  bars?: number;
  className?: string;
  label?: string;
}

export function AudioVisualizer({
  active = false,
  tone = "idle",
  bars = 7,
  className,
  label,
}: AudioVisualizerProps) {
  const color =
    tone === "twin"
      ? "bg-primary"
      : tone === "caller"
        ? "bg-indigo-400"
        : "bg-muted-foreground";

  return (
    <div
      className={cn("flex h-10 items-end justify-center gap-1", className)}
      role="img"
      aria-label={label ?? (active ? "Voice activity" : "No voice activity")}
    >
      {Array.from({ length: bars }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "w-1 origin-bottom rounded-full transition-[height,opacity] duration-300",
            color,
            active ? "h-9 animate-equalize opacity-90" : "h-2 opacity-30",
          )}
          style={
            active
              ? { animationDelay: `${BAR_DELAYS[index % BAR_DELAYS.length]}ms` }
              : undefined
          }
        />
      ))}
    </div>
  );
}
