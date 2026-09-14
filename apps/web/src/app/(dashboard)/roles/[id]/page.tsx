import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { RoleConfiguration } from "@/components/roles/configuration/role-configuration";

export const metadata: Metadata = { title: "Role configuration" };

export default async function RoleConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer>
      <RoleConfiguration roleId={id} />
    </PageContainer>
  );
}
