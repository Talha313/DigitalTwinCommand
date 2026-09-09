import { roles } from "@/lib/mock-data/roles";
import type { RiskLevel, Role } from "@/lib/mock-data/types";

const RISK_ORDER: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };

/** Roles matching the given ids, preserving catalog order. */
export function rolesByIds(ids: string[]): Role[] {
  return roles.filter((role) => ids.includes(role.id));
}

/** Highest risk level across the selected roles (defaults to "low"). */
export function combinedRisk(ids: string[]): RiskLevel {
  return rolesByIds(ids).reduce<RiskLevel>(
    (acc, role) =>
      RISK_ORDER[role.riskLevel] > RISK_ORDER[acc] ? role.riskLevel : acc,
    "low",
  );
}
