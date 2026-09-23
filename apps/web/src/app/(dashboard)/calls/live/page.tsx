import type { Metadata } from "next";
import { Suspense } from "react";

import { LiveCallPanel } from "@/components/calls/live-call-panel";

export const metadata: Metadata = { title: "Live Call" };

export default function LiveCallPage() {
  return (
    <Suspense fallback={null}>
      <LiveCallPanel />
    </Suspense>
  );
}
