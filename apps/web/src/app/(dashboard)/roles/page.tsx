import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";

import { RolesClient } from "./roles-client";

export const metadata: Metadata = { title: "Roles" };

export default function RolesPage() {
  return (
    <PageContainer>
      <RolesClient />
    </PageContainer>
  );
}
