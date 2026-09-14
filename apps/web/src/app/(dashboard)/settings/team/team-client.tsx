"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import { ApiError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth";
import { listUsers, updateUser, type AdminUserRead } from "@/lib/users";

const ROLES: AdminUserRead["role"][] = ["viewer", "operator", "admin"];
const STATUSES: AdminUserRead["status"][] = ["active", "inactive"];

const ROLE_LABEL: Record<AdminUserRead["role"], string> = {
  viewer: "Viewer",
  operator: "Operator",
  admin: "Admin",
};

export function TeamClient() {
  const [users, setUsers] = React.useState<AdminUserRead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const currentUserId = getStoredUser()?.id ?? null;

  const refresh = React.useCallback(async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load the team — you may need admin access.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const patch = async (id: string, body: Parameters<typeof updateUser>[1]) => {
    setBusyId(id);
    setError(null);
    try {
      const updated = await updateUser(id, body);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update this user.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-3">
        <Link
          href="/settings"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Settings
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Team</h2>
          <p className="text-sm text-muted-foreground">
            Operators and admins with access to this Command Center. New accounts
            are created via sign-up — this screen manages role and access only.
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading team…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
                return (
                  <tr key={user.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {name || user.email}
                        {isSelf ? (
                          <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                        ) : null}
                      </p>
                      {name ? (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {ROLES.map((role) => (
                          <button
                            key={role}
                            type="button"
                            disabled={isSelf || busyId === user.id}
                            onClick={() => patch(user.id, { role })}
                            className={cn(
                              "rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                              user.role === role
                                ? "border-primary/50 bg-primary/10 text-primary"
                                : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {ROLE_LABEL[role]}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {STATUSES.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={isSelf || busyId === user.id}
                            onClick={() => patch(user.id, { status })}
                            className={cn(
                              "rounded-md border px-2 py-1 text-xs font-medium capitalize transition-colors disabled:opacity-50",
                              user.status === status
                                ? status === "active"
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                  : "border-border/60 bg-background/60 text-muted-foreground"
                                : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
