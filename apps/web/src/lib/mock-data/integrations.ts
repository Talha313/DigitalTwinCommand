/**
 * Integrations catalog — UI preview only.
 *
 * Real credentials live server-side (see CLAUDE.md env vars). This screen never
 * stores, sends, or reveals a key; statuses below are illustrative and reflect
 * the "do not fake a successful integration" rule (S3 is genuinely unset).
 */

export type IntegrationStatusId =
  | "connected"
  | "action_required"
  | "not_configured"
  | "error";

export interface IntegrationCapability {
  id: string;
  label: string;
  enabled: boolean;
}

export interface IntegrationField {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  configured: boolean;
  hint?: string;
  /** Masked hint for a configured secret, e.g. "••••••••3f2a". */
  maskedPreview?: string;
  /** Visible value for a configured non-secret field, e.g. "us-east-1". */
  value?: string;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  purpose: string;
  description: string;
  status: IntegrationStatusId;
  statusDetail: string;
  lastCheckedLabel?: string;
  docsUrl: string;
  capabilities: IntegrationCapability[];
  fields: IntegrationField[];
}

export const integrations: Integration[] = [
  {
    id: "twilio",
    name: "Twilio",
    category: "Telephony",
    purpose: "Phone communication",
    description:
      "Programmable Voice for inbound and outbound calls, the phone number, and call state.",
    status: "connected",
    statusDetail: "Connected",
    lastCheckedLabel: "Checked 4m ago",
    docsUrl: "https://www.twilio.com/docs/voice",
    capabilities: [
      { id: "inbound", label: "Inbound calls", enabled: true },
      { id: "outbound", label: "Outbound calls", enabled: true },
      { id: "webhook-validation", label: "Webhook signature validation", enabled: true },
    ],
    fields: [
      {
        key: "TWILIO_ACCOUNT_SID",
        label: "Account SID",
        secret: true,
        required: true,
        configured: true,
        maskedPreview: "••••••••••••a91c",
      },
      {
        key: "TWILIO_AUTH_TOKEN",
        label: "Auth token",
        secret: true,
        required: true,
        configured: true,
        maskedPreview: "••••••••3f2a",
      },
      {
        key: "TWILIO_PHONE_NUMBER",
        label: "Phone number",
        secret: false,
        required: true,
        configured: true,
        value: "+1 (415) 555-0100",
      },
    ],
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    category: "Voice",
    purpose: "AI voice and voice clone",
    description:
      "Text-to-speech, speech-to-text, and the Professional Voice Clone used on every call.",
    status: "connected",
    statusDetail: "Connected · Professional Voice Clone active",
    lastCheckedLabel: "Checked 12m ago",
    docsUrl: "https://elevenlabs.io/docs",
    capabilities: [
      { id: "tts", label: "Text-to-speech", enabled: true },
      { id: "stt", label: "Speech-to-text", enabled: true },
      { id: "clone", label: "Professional Voice Clone", enabled: true },
      { id: "agent", label: "Voice agent", enabled: true },
    ],
    fields: [
      {
        key: "ELEVENLABS_API_KEY",
        label: "API key",
        secret: true,
        required: true,
        configured: true,
        maskedPreview: "••••••••7b10",
      },
      {
        key: "ELEVENLABS_AGENT_ID",
        label: "Agent ID",
        secret: false,
        required: true,
        configured: true,
        value: "agent_9f2b41c7",
      },
      {
        key: "ELEVENLABS_VOICE_ID",
        label: "Voice ID (Professional Voice Clone)",
        secret: false,
        required: true,
        configured: true,
        value: "voice_pvc_5d8a20",
        hint: "Must be the configured Professional Voice Clone — not a stock voice.",
      },
    ],
  },
  {
    id: "xai",
    name: "Grok / xAI",
    category: "AI engine",
    purpose: "AI reasoning engine",
    description:
      "The V1 reasoning model behind the LLM router. Replaceable later without touching the rest of the stack.",
    status: "connected",
    statusDetail: "Connected · grok-2",
    lastCheckedLabel: "Checked 2m ago",
    docsUrl: "https://docs.x.ai",
    capabilities: [
      { id: "chat", label: "Chat completions", enabled: true },
      { id: "streaming", label: "SSE streaming", enabled: true },
      { id: "tools", label: "Tool calling", enabled: true },
      { id: "research", label: "Research (market reports)", enabled: true },
    ],
    fields: [
      {
        key: "XAI_API_KEY",
        label: "API key",
        secret: true,
        required: true,
        configured: true,
        maskedPreview: "••••••••c4e9",
      },
      {
        key: "XAI_MODEL",
        label: "Model",
        secret: false,
        required: true,
        configured: true,
        value: "grok-2",
      },
    ],
  },
  {
    id: "heygen",
    name: "HeyGen",
    category: "Video",
    purpose: "Avatar video generation",
    description:
      "Talking-head avatar rendering for the daily market report. Runs in the worker, never in a request.",
    status: "action_required",
    statusDetail: "API key saved — add an avatar ID to enable rendering.",
    lastCheckedLabel: "Checked 1h ago",
    docsUrl: "https://docs.heygen.com",
    capabilities: [
      { id: "avatar-video", label: "Avatar video", enabled: false },
      { id: "talking-head", label: "Talking-head render", enabled: false },
    ],
    fields: [
      {
        key: "HEYGEN_API_KEY",
        label: "API key",
        secret: true,
        required: true,
        configured: true,
        maskedPreview: "••••••••11d7",
      },
      {
        key: "HEYGEN_AVATAR_ID",
        label: "Avatar ID",
        secret: false,
        required: true,
        configured: false,
        hint: "The avatar to render the report with.",
      },
    ],
  },
  {
    id: "s3",
    name: "AWS S3",
    category: "Storage",
    purpose: "Media storage",
    description:
      "Object storage for call recordings, generated audio, avatar videos, captions, and training exports.",
    status: "not_configured",
    statusDetail: "No credentials configured.",
    docsUrl: "https://docs.aws.amazon.com/s3",
    capabilities: [
      { id: "recordings", label: "Call recordings", enabled: false },
      { id: "audio", label: "Generated audio", enabled: false },
      { id: "video", label: "Avatar videos", enabled: false },
      { id: "exports", label: "Training exports", enabled: false },
    ],
    fields: [
      {
        key: "AWS_ACCESS_KEY_ID",
        label: "Access key ID",
        secret: true,
        required: true,
        configured: false,
      },
      {
        key: "AWS_SECRET_ACCESS_KEY",
        label: "Secret access key",
        secret: true,
        required: true,
        configured: false,
      },
      {
        key: "AWS_REGION",
        label: "Region",
        secret: false,
        required: true,
        configured: false,
        hint: "e.g. us-east-1",
      },
      {
        key: "AWS_S3_BUCKET",
        label: "Bucket",
        secret: false,
        required: true,
        configured: false,
      },
    ],
  },
];

export function getIntegration(id: string): Integration | undefined {
  return integrations.find((integration) => integration.id === id);
}
