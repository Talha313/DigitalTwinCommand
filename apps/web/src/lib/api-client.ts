/** Minimal fetch wrapper for the FastAPI backend. */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");
const BASE_URL = API_BASE_URL;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Sessions are httpOnly cookies set by the backend on login/signup
 * (`credentials: "include"` sends and receives them); there is no
 * client-readable token to manage here.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  }).catch(() => {
    throw new ApiError(0, "network_error", "Could not reach the server.");
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const err = payload?.error;
    throw new ApiError(
      response.status,
      err?.code ?? "error",
      err?.message ?? payload?.detail ?? "Request failed.",
    );
  }

  return payload as T;
}
