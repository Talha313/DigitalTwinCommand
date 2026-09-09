import type { Metadata } from "next";

import { LiveCallPanel } from "@/components/calls/live-call-panel";

export const metadata: Metadata = { title: "Live Call" };

export default function LiveCallPage() {
  return <LiveCallPanel />;
}
