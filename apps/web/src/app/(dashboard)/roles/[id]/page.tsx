import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { RoleConfiguration } from "@/components/roles/configuration/role-configuration";
import { getRoleConfig } from "@/lib/mock-data/role-config";
import { getRole, roles } from "@/lib/mock-data/roles";

export function generateStaticParams() {
  return roles.map((role) => ({ id: role.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const role = getRole(id);
  return { title: role ? `Configure ${role.name}` : "Role configuration" };
}

export default async function RoleConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const config = getRoleConfig(id);
  if (!config) notFound();

  return (
    <PageContainer>
      <RoleConfiguration initialConfig={config} />
    </PageContainer>
  );
}
