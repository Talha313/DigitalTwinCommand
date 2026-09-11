/** Auth API calls + local session-user cache.
 *
 * The backend authenticates via httpOnly cookies (see api-client.ts), so
 * there's no token to store here — only the user profile, cached for
 * synchronous UI reads (e.g. the user menu) between page loads.
 */
import { apiFetch } from "./api-client";

export type UserRole = "admin" | "operator" | "viewer";
export type UserStatus = "active" | "inactive";

export interface AuthUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  status: UserStatus;
}

interface SessionResponse {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface ForgotPasswordResponse {
  ok: boolean;
  reset_token: string | null;
}

const USER_KEY = "dtcc.user";

function persistSession(res: SessionResponse): AuthUser {
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  } catch {
    /* storage unavailable */
  }
  return res.user;
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable */
  }
}

export async function signup(input: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}): Promise<AuthUser> {
  const res = await apiFetch<SessionResponse>("/api/auth/signup", {
    method: "POST",
    json: input,
  });
  return persistSession(res);
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const res = await apiFetch<SessionResponse>("/api/auth/login", {
    method: "POST",
    json: input,
  });
  return persistSession(res);
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

export function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>("/api/auth/forgot-password", {
    method: "POST",
    json: { email },
  });
}

export function resetPassword(input: {
  token: string;
  password: string;
}): Promise<void> {
  return apiFetch<void>("/api/auth/reset-password", {
    method: "POST",
    json: input,
  });
}
