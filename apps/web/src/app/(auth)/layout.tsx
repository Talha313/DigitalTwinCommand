import type { ReactNode } from "react";

import { AuthLayout } from "@/components/auth";

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
