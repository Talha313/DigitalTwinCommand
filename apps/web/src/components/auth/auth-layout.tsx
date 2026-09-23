import type { ReactNode } from "react";
import { Radio, ShieldCheck, Sparkles, Waypoints } from "lucide-react";

import { cn } from "@/lib/utils";

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-500 shadow-lg shadow-primary/25">
        <Waypoints className="h-5 w-5 text-primary-foreground" aria-hidden />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          Digital Twin
        </p>
        <p className="text-xs text-muted-foreground">Command Center</p>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Radio, label: "Live call transcripts with operator whisper injection" },
  { icon: ShieldCheck, label: "Role-based AI behavior, permissions, and risk gating" },
  { icon: Sparkles, label: "Daily AI-generated market reports and avatar briefings" },
] as const;

export interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto lg:flex-row">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-grid absolute inset-0 opacity-60" />
        <div className="absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <aside className="relative hidden flex-col justify-between border-r border-border/60 bg-card/30 p-10 backdrop-blur-sm lg:flex lg:w-[46%] xl:w-1/2 xl:p-14">
        <BrandMark />

        <div className="max-w-md space-y-6">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground xl:text-4xl">
            Command your Digital Twin from one operational console.
          </h2>
          <p className="text-muted-foreground">
            AI-powered phone calls, real-time telemetry, and role-driven
            behavior — built for operators who need control and clarity.
          </p>
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/60">
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} Digital Twin Command Center
        </p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <BrandMark className="mb-8 justify-center lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
