export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-2 text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <span className="flex gap-1" aria-hidden>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
      </span>
      Digital Twin is thinking&hellip;
    </div>
  );
}
