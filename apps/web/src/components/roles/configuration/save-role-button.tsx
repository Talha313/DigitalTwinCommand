"use client";

import * as React from "react";
import { Check, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";

type SaveStatus = "idle" | "saving" | "saved";

export interface SaveRoleButtonProps {
  dirty: boolean;
  onSave: () => Promise<void> | void;
  onDiscard: () => void;
}

export function SaveRoleButton({
  dirty,
  onSave,
  onDiscard,
}: SaveRoleButtonProps) {
  const [status, setStatus] = React.useState<SaveStatus>("idle");

  React.useEffect(() => {
    if (dirty) setStatus("idle");
  }, [dirty]);

  const handleSave = async () => {
    setStatus("saving");
    await onSave();
    setStatus("saved");
  };

  const message =
    status === "saving"
      ? "Saving…"
      : status === "saved" && !dirty
        ? "All changes saved"
        : dirty
          ? "Unsaved changes"
          : "No changes";

  return (
    <div className="sticky bottom-4 z-10">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/95 p-3 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {message}
          <span className="text-muted-foreground/70">
            {" "}
            · UI preview, not persisted
          </span>
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            disabled={!dirty || status === "saving"}
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || status === "saving"}
            className="gap-2"
          >
            {status === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : status === "saved" && !dirty ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            {status === "saving" ? "Saving" : "Save role"}
          </Button>
        </div>
      </div>
    </div>
  );
}
