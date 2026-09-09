"use client";

import * as React from "react";
import {
  ArrowUpRight,
  Check,
  Clapperboard,
  Database,
  Loader2,
  Phone,
  Sparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Integration } from "@/lib/mock-data/integrations";

import { ApiKeyInput } from "./api-key-input";
import { ConnectionTest } from "./connection-test";
import { IntegrationStatus } from "./integration-status";

const ICON: Record<string, LucideIcon> = {
  twilio: Phone,
  elevenlabs: Waves,
  xai: Sparkles,
  heygen: Clapperboard,
  s3: Database,
};

type SaveState = "idle" | "saving" | "saved";

export interface IntegrationModalProps {
  integration: Integration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IntegrationModal({
  integration,
  open,
  onOpenChange,
}: IntegrationModalProps) {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setValues({});
    setSaveState("idle");
  }, [integration?.id]);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const dirty = Object.values(values).some((value) => value.trim().length > 0);

  const save = () => {
    setSaveState("saving");
    timerRef.current = setTimeout(() => setSaveState("saved"), 700);
  };

  const Icon = integration ? (ICON[integration.id] ?? Sparkles) : Sparkles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-lg">
        {integration ? (
          <>
            <DialogHeader className="shrink-0 border-b border-border/60 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <DialogTitle>{integration.name}</DialogTitle>
                  <DialogDescription>
                    {integration.category} · {integration.purpose}
                  </DialogDescription>
                </div>
              </div>
              <div className="mt-2">
                <IntegrationStatus
                  status={integration.status}
                  detail={integration.statusDetail}
                />
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <p className="rounded-lg border border-border/50 bg-background/40 p-3 text-xs text-muted-foreground">
                Credentials are stored server-side. This screen never saves,
                sends, or reveals a real key.
              </p>

              <div className="space-y-4">
                {integration.fields.map((field) => (
                  <ApiKeyInput
                    key={field.key}
                    label={field.label}
                    name={field.key}
                    secret={field.secret}
                    required={field.required}
                    hint={field.hint}
                    configured={field.configured}
                    maskedPreview={field.maskedPreview}
                    savedValue={field.value}
                    value={values[field.key] ?? ""}
                    onChange={(next) =>
                      setValues((current) => ({
                        ...current,
                        [field.key]: next,
                      }))
                    }
                  />
                ))}
              </div>

              <ConnectionTest integration={integration} />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Capabilities
                </p>
                <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                  {integration.capabilities.map((capability) => (
                    <li
                      key={capability.id}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <Check
                        className={
                          capability.enabled
                            ? "h-3.5 w-3.5 text-emerald-300"
                            : "h-3.5 w-3.5 text-muted-foreground/50"
                        }
                        aria-hidden
                      />
                      {capability.label}
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={integration.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Provider documentation
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </a>
            </div>

            <DialogFooter className="shrink-0 items-center border-t border-border/60 p-5 sm:justify-between">
              <p className="text-[11px] text-muted-foreground">
                {saveState === "saving"
                  ? "Saving…"
                  : saveState === "saved"
                    ? "Saved (UI preview — not persisted)"
                    : "UI preview — changes are not persisted"}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={save}
                  disabled={!dirty || saveState === "saving"}
                  className="gap-2"
                >
                  {saveState === "saving" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  {saveState === "saving" ? "Saving" : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
