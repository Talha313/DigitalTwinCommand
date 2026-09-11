/** Integrations API calls. Types mirror backend/app/models/integrations.py.
 *
 * `configuration` (which may hold secrets) is intentionally never returned by
 * the API — `IntegrationRead` doesn't have the field at all. The credential
 * UI is built around that: it can only ever *set/replace* a field, never
 * show or diff against a real stored value.
 */
import { apiFetch } from "./api-client";

export type IntegrationStatus = "connected" | "error" | "disabled";

export interface IntegrationRead {
  id: string;
  name: string;
  provider: string;
  type: string | null;
  status: IntegrationStatus;
  created_at: string;
}

export interface IntegrationCreate {
  name: string;
  provider: string;
  type?: string;
  configuration?: Record<string, unknown>;
  status?: IntegrationStatus;
}

export interface IntegrationUpdate {
  name?: string;
  type?: string;
  status?: IntegrationStatus;
  configuration?: Record<string, unknown>;
}

export interface ConnectionTestResult {
  ok: boolean;
  status: IntegrationStatus;
  detail: string | null;
}

export function listIntegrations(): Promise<IntegrationRead[]> {
  return apiFetch<IntegrationRead[]>("/api/integrations");
}

export function getIntegration(id: string): Promise<IntegrationRead> {
  return apiFetch<IntegrationRead>(`/api/integrations/${id}`);
}

/** Admin only. Not currently exposed by any UI flow — there is no "add
 * integration" screen, only configuring the fixed set of rows the backend
 * seeds — but kept here so one can be added without touching the backend
 * contract. */
export function createIntegration(
  input: IntegrationCreate,
): Promise<IntegrationRead> {
  return apiFetch<IntegrationRead>("/api/integrations", {
    method: "POST",
    json: input,
  });
}

/** Admin only (backend returns 403 for non-admins). */
export function updateIntegration(
  id: string,
  patch: IntegrationUpdate,
): Promise<IntegrationRead> {
  return apiFetch<IntegrationRead>(`/api/integrations/${id}`, {
    method: "PATCH",
    json: patch,
  });
}

/** Admin only. Live-probes the real provider and updates + returns the
 * row's status based on the result — not a simulation. */
export function testConnection(id: string): Promise<ConnectionTestResult> {
  return apiFetch<ConnectionTestResult>(`/api/integrations/${id}/test`, {
    method: "POST",
  });
}

/* ------------------------------------------------------------------------ *
 * Provider catalog — client-side UI metadata only.
 *
 * The backend's `configuration` column is an opaque JSON object; it has no
 * concept of "fields." This is a static description of the shape each known
 * provider's configuration takes (matching the provider strings the
 * backend's connection-test probe matches on — see
 * backend/app/services/integrations.py:_probe), used only to render a
 * sensible credential form. It's a UI convenience describing a known
 * integration, not fabricated data: no values, statuses, or "configured"
 * flags here, only field labels/keys.
 * ------------------------------------------------------------------------ */

export interface ProviderField {
  key: string;
  label: string;
  secret: boolean;
  hint?: string;
}

export interface ProviderCapability {
  id: string;
  label: string;
}

export interface ProviderMeta {
  category: string;
  purpose: string;
  description: string;
  docsUrl: string;
  icon: "phone" | "waves" | "sparkles" | "clapperboard" | "database" | "bell";
  capabilities: ProviderCapability[];
  fields: ProviderField[];
}

const PROVIDER_CATALOG: Record<string, ProviderMeta> = {
  twilio: {
    category: "Telephony",
    purpose: "Phone communication",
    description:
      "Programmable Voice for inbound and outbound calls, the phone number, and call state.",
    docsUrl: "https://www.twilio.com/docs/voice",
    icon: "phone",
    capabilities: [
      { id: "inbound", label: "Inbound calls" },
      { id: "outbound", label: "Outbound calls" },
      { id: "webhook-validation", label: "Webhook signature validation" },
    ],
    fields: [
      { key: "account_sid", label: "Account SID", secret: true },
      { key: "auth_token", label: "Auth token", secret: true },
      { key: "phone_number", label: "Phone number", secret: false },
    ],
  },
  elevenlabs: {
    category: "Voice",
    purpose: "AI voice and voice clone",
    description:
      "Text-to-speech, speech-to-text, and the Professional Voice Clone used on every call.",
    docsUrl: "https://elevenlabs.io/docs",
    icon: "waves",
    capabilities: [
      { id: "tts", label: "Text-to-speech" },
      { id: "stt", label: "Speech-to-text" },
      { id: "clone", label: "Professional Voice Clone" },
      { id: "agent", label: "Voice agent" },
    ],
    fields: [
      { key: "api_key", label: "API key", secret: true },
      { key: "agent_id", label: "Agent ID", secret: false },
      {
        key: "voice_id",
        label: "Voice ID (Professional Voice Clone)",
        secret: false,
        hint: "Must be the configured Professional Voice Clone — not a stock voice.",
      },
    ],
  },
  anthropic: {
    category: "AI engine",
    purpose: "AI reasoning engine",
    description:
      "Claude powers the dashboard chat, the daily-report research + script, and grading.",
    docsUrl: "https://docs.anthropic.com",
    icon: "sparkles",
    capabilities: [
      { id: "chat", label: "Chat completions" },
      { id: "streaming", label: "SSE streaming" },
      { id: "web-search", label: "Web search (market reports)" },
    ],
    fields: [
      { key: "api_key", label: "API key", secret: true },
      { key: "chat_model", label: "Chat model", secret: false },
    ],
  },
  heygen: {
    category: "Video",
    purpose: "Avatar video generation",
    description:
      "Talking-head avatar rendering for the daily market report. Runs in the worker, never in a request.",
    docsUrl: "https://docs.heygen.com",
    icon: "clapperboard",
    capabilities: [
      { id: "avatar-video", label: "Avatar video" },
      { id: "talking-head", label: "Talking-head render" },
    ],
    fields: [
      { key: "api_key", label: "API key", secret: true },
      { key: "avatar_id", label: "Avatar ID", secret: false, hint: "The avatar to render the report with." },
    ],
  },
  s3: {
    category: "Storage",
    purpose: "Media storage",
    description:
      "Object storage for call recordings, generated audio, avatar videos, captions, and training exports.",
    docsUrl: "https://docs.aws.amazon.com/s3",
    icon: "database",
    capabilities: [
      { id: "recordings", label: "Call recordings" },
      { id: "audio", label: "Generated audio" },
      { id: "video", label: "Avatar videos" },
      { id: "exports", label: "Training exports" },
    ],
    fields: [
      { key: "access_key_id", label: "Access key ID", secret: true },
      { key: "secret_access_key", label: "Secret access key", secret: true },
      { key: "region", label: "Region", secret: false, hint: "e.g. us-east-1" },
      { key: "bucket", label: "Bucket", secret: false },
    ],
  },
  push: {
    category: "Notifications",
    purpose: "Browser push notifications",
    description: "Web Push (VAPID) notifications for operator alerts.",
    docsUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Push_API",
    icon: "bell",
    capabilities: [{ id: "webpush", label: "Web push delivery" }],
    fields: [
      { key: "vapid_public_key", label: "VAPID public key", secret: false },
      { key: "vapid_private_key", label: "VAPID private key", secret: true },
      { key: "vapid_subject", label: "Subject (mailto:)", secret: false },
    ],
  },
};

/** Aliases the backend probe also matches on (see `_probe` in
 * backend/app/services/integrations.py), mapped to the canonical catalog
 * entry above. */
const PROVIDER_ALIASES: Record<string, string> = {
  claude: "anthropic",
  did: "heygen",
  lipsync: "heygen",
  aws: "s3",
  storage: "s3",
  webpush: "push",
};

const GENERIC_META: ProviderMeta = {
  category: "Integration",
  purpose: "Third-party service",
  description: "Configuration for this integration is a freeform key/value object.",
  docsUrl: "#",
  icon: "sparkles",
  capabilities: [],
  fields: [],
};

/** Looks up the static field/capability catalog for a provider string,
 * matched case-insensitively the same way the backend's connection test
 * does. Returns a generic (fields-less) fallback for unknown providers —
 * those get a generic key/value editor in the UI instead of named fields. */
export function getProviderMeta(provider: string): ProviderMeta {
  const key = provider.trim().toLowerCase();
  const canonical = PROVIDER_ALIASES[key] ?? key;
  return PROVIDER_CATALOG[canonical] ?? GENERIC_META;
}

export function isKnownProvider(provider: string): boolean {
  const key = provider.trim().toLowerCase();
  const canonical = PROVIDER_ALIASES[key] ?? key;
  return canonical in PROVIDER_CATALOG;
}
