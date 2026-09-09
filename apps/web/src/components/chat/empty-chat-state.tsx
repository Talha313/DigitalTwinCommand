import { Sparkles } from "lucide-react";

export interface EmptyChatStateProps {
  roleNames: string[];
  prompts: string[];
  onPromptSelect: (prompt: string) => void;
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function EmptyChatState({
  roleNames,
  prompts,
  onPromptSelect,
}: EmptyChatStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-500">
        <Sparkles className="h-6 w-6 text-primary-foreground" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-foreground">
        Start a conversation
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {roleNames.length > 0
          ? `The Digital Twin will respond using the ${formatList(roleNames)} role${
              roleNames.length > 1 ? "s" : ""
            }.`
          : "Select at least one role so the Digital Twin knows how to respond."}
      </p>

      <div className="mt-6 flex w-full max-w-md flex-wrap justify-center gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPromptSelect(prompt)}
            className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
