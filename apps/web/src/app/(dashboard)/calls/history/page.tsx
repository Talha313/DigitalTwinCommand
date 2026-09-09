import type { Metadata } from "next";

import { CallHistoryClient } from "./history-client";

export const metadata: Metadata = { title: "Call History" };

export default function CallHistoryPage() {
  return <CallHistoryClient />;
}
