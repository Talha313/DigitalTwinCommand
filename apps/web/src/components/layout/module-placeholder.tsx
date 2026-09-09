import { Construction } from "lucide-react";

import { PageContainer } from "./page-container";

export interface ModulePlaceholderProps {
  title: string;
  description: string;
}

/** Shared stub for dashboard routes that are not built yet. */
export function ModulePlaceholder({
  title,
  description,
}: ModulePlaceholderProps) {
  return (
    <PageContainer>
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background/60">
          <Construction className="h-6 w-6 text-primary" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </PageContainer>
  );
}
