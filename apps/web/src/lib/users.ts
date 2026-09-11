/** User management API calls (admin only). Types mirror
 * backend/app/models/auth.py::UserRead and backend/app/models/users.py. */
import { apiFetch } from "./api-client";
import type { UserRole, UserStatus } from "./auth";

export interface AdminUserRead {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export function listUsers(): Promise<AdminUserRead[]> {
  return apiFetch<AdminUserRead[]>("/api/users");
}

export function updateUser(
  userId: string,
  patch: { role?: UserRole; status?: UserStatus },
): Promise<AdminUserRead> {
  return apiFetch<AdminUserRead>(`/api/users/${userId}`, {
    method: "PATCH",
    json: patch,
  });
}
