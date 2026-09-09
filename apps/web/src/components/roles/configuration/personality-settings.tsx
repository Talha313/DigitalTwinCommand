"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  BEHAVIOR_PREFERENCES,
  RESPONSE_STYLE_OPTIONS,
  type ResponseStyleId,
  type ToneId,
} from "@/lib/mock-data/role-config";

import { ToneSelector } from "./tone-selector";

export interface PersonalitySettingsProps {
  tone: ToneId;
  responseStyle: ResponseStyleId;
  preferences: string[];
  onToneChange: (tone: ToneId) => void;
  onResponseStyleChange: (style: ResponseStyleId) => void;
  onPreferencesChange: (ids: string[]) => void;
}

export function PersonalitySettings({
  tone,
  responseStyle,
  preferences,
  onToneChange,
  onResponseStyleChange,
  onPreferencesChange,
}: PersonalitySettingsProps) {
  const activeStyle = RESPONSE_STYLE_OPTIONS.find(
    (option) => option.id === responseStyle,
  );

  const togglePreference = (id: string) =>
    onPreferencesChange(
      preferences.includes(id)
        ? preferences.filter((value) => value !== id)
        : [...preferences, id],
    );

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">Personality</h3>
        <p className="text-xs text-muted-foreground">
          Tone, response style, and behavior for this role.
        </p>
      </div>

      <div className="space-y-5 p-5">
        <ToneSelector value={tone} onChange={onToneChange} />

        <div>
          <p className="text-sm font-medium text-foreground">Response style</p>
          <div
            role="group"
            aria-label="Response style"
            className="mt-2 flex gap-1"
          >
            {RESPONSE_STYLE_OPTIONS.map((option) => {
              const active = responseStyle === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onResponseStyleChange(option.id)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {activeStyle ? (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {activeStyle.description}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">
            Behavior preferences
          </p>
          <ul className="mt-2 space-y-2">
            {BEHAVIOR_PREFERENCES.map((preference) => {
              const enabled = preferences.includes(preference.id);
              return (
                <li
                  key={preference.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
                >
                  <div className="min-w-0">
                    <span
                      id={`pref-${preference.id}`}
                      className="block text-sm text-foreground"
                    >
                      {preference.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {preference.description}
                    </span>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => togglePreference(preference.id)}
                    aria-labelledby={`pref-${preference.id}`}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
