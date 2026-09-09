import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { RiskBadge } from "@/components/roles/risk-badge";
import { toolIcon } from "@/components/roles/tool-icon";
import { getRole } from "@/lib/mock-data/roles";
import type { ChatMessage, ToolInvocationStatus } from "@/lib/mock-data/types";

const TOOL_STATUS: Record<
  ToolInvocationStatus,
  { label: string; className: string }
> = {
  running: { label: "Running", className: "text-amber-300" },
  completed: { label: "Done", className: "text-emerald-300" },
  blocked: { label: "Blocked", className: "text-rose-300" },
};

export interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.author === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-primary/20 bg-primary/10 px-3.5 py-2.5 sm:max-w-[75%]">
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {message.content}
          </p>
          <p className="mt-1 text-right text-[11px] text-muted-foreground">
            {message.timestamp}
          </p>
        </div>
      </div>
    );
  }

  const role = message.roleId ? getRole(message.roleId) : undefined;

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-500">
        <Sparkles className="h-4 w-4 text-primary-foreground" aria-hidden />
      </span>
      <div className="min-w-0 max-w-[85%] sm:max-w-[80%]">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            Digital Twin
          </span>
          {role ? (
            <>
              <span className="text-xs text-muted-foreground">
                &middot; {role.shortName}
              </span>
              <RiskBadge level={role.riskLevel} showLabel={false} />
            </>
          ) : null}
        </div>

        <div className="rounded-2xl rounded-tl-sm border border-border/60 bg-card px-3.5 py-2.5">
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {message.content}
          </p>
        </div>

        {message.tools && message.tools.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {message.tools.map((tool) => {
              const Icon = toolIcon(tool.toolId);
              const status = TOOL_STATUS[tool.status];
              return (
                <li
                  key={tool.id}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5 text-xs"
                >
                  <Icon
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="shrink-0 text-foreground">{tool.label}</span>
                  {tool.detail ? (
                    <span className="truncate text-muted-foreground">
                      &middot; {tool.detail}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "ml-auto shrink-0 font-medium",
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}

        <p className="mt-1 text-[11px] text-muted-foreground">
          {message.timestamp}
        </p>
      </div>
    </div>
  );
}
