"use client";

import * as React from "react";

import { listRoles, type RiskLevel, type RoleRead } from "./roles";

const RISK_ORDER: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };

export function rolesByIds(roles: RoleRead[], ids: string[]): RoleRead[] {
  return roles.filter((role) => ids.includes(role.id));
}

export function combinedRisk(roles: RoleRead[], ids: string[]): RiskLevel {
  return rolesByIds(roles, ids).reduce<RiskLevel>(
    (acc, role) => (RISK_ORDER[role.risk_level] > RISK_ORDER[acc] ? role.risk_level : acc),
    "low",
  );
}

interface RolesContextValue {
  roles: RoleRead[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const RolesContext = React.createContext<RolesContextValue | null>(null);

/** Fetches the role catalog once and shares it with every dashboard page. */
export function RolesProvider({ children }: { children: React.ReactNode }) {
  const [roles, setRoles] = React.useState<RoleRead[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const data = await listRoles();
      setRoles(data);
    } catch {
      /* leave the previous cache in place on a transient failure */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = React.useMemo(() => ({ roles, loading, refresh }), [roles, loading, refresh]);

  return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>;
}

export function useRolesContext(): RolesContextValue {
  const ctx = React.useContext(RolesContext);
  if (!ctx) throw new Error("useRolesContext must be used within RolesProvider");
  return ctx;
}

export function useRolesByIds(ids: string[]): RoleRead[] {
  const { roles } = useRolesContext();
  return rolesByIds(roles, ids);
}

export function useCombinedRisk(ids: string[]): RiskLevel {
  const { roles } = useRolesContext();
  return combinedRisk(roles, ids);
}
