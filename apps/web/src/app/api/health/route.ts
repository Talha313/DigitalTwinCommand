import { NextResponse } from "next/server";

// Static readiness probe. No backend wiring yet.
export function GET() {
  return NextResponse.json({ status: "ok" });
}
