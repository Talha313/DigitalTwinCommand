/** Roles/permissions/tools API calls. Types mirror backend/app/models/roles.py. */
import { apiFetch } from "./api-client";

export type RiskLevel = "low" | "medium" | "high";

export interface PermissionRead {
  id: string;
  name: string;
  description: string | null;
}

export interface ToolRead {
  id: string;
  name: string;
  provider: string | null;
  description: string | null;
}

export interface RoleToolAccess {
  tool: ToolRead;
  enabled: boolean;
}

/**
 * Free-form role personality/config. The backend only guarantees this is a
 * JSON object — this is our own agreed-upon shape for it, written and read
 * by this app only (no server-side validation of these specific fields).
 */
export interface RolePersonality {
  summary?: string;
  traits?: string[];
  systemPromptPreview?: string;
  responseStyle?: "concise" | "balanced" | "detailed";
  behaviorPreferences?: string[];
}

export interface RoleRead {
  id: string;
  name: string;
  description: string | null;
  personality: RolePersonality | null;
  tone: string | null;
  risk_level: RiskLevel;
  is_active: boolean;
  permissions: PermissionRead[];
  tools: RoleToolAccess[];
}

export interface RoleCreate {
  name: string;
  description?: string | null;
  personality?: RolePersonality | null;
  tone?: string | null;
  risk_level?: RiskLevel;
  is_active?: boolean;
  permission_ids?: string[];
  tool_ids?: string[];
}

export type RoleUpdate = Partial<RoleCreate>;

/** First word of the role name — the backend has no separate "short name". */
export function shortName(name: string): string {
  return name.split(" ")[0] ?? name;
}

/** Category label derived from a dotted permission name, e.g. "portfolio.read" -> "Portfolio". */
export function permissionCategory(permissionName: string): string {
  const [prefix] = permissionName.split(".");
  const label = prefix || permissionName;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function listRoles(): Promise<RoleRead[]> {
  return apiFetch<RoleRead[]>("/api/roles");
}

export function getRole(roleId: string): Promise<RoleRead> {
  return apiFetch<RoleRead>(`/api/roles/${roleId}`);
}

export function createRole(input: RoleCreate): Promise<RoleRead> {
  return apiFetch<RoleRead>("/api/roles", { method: "POST", json: input });
}

export function updateRole(roleId: string, input: RoleUpdate): Promise<RoleRead> {
  return apiFetch<RoleRead>(`/api/roles/${roleId}`, { method: "PATCH", json: input });
}

export function listPermissions(): Promise<PermissionRead[]> {
  return apiFetch<PermissionRead[]>("/api/permissions");
}

export function listTools(): Promise<ToolRead[]> {
  return apiFetch<ToolRead[]>("/api/tools");
}
