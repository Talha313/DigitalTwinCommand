/** WebSocket client for the live-call stream (`/ws/calls/{id}`, see backend/app/routers/ws.py). */
import { getAccessToken } from "./auth";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

const WS_BASE_URL = BASE_URL.replace(/^http/, "ws");

export type CallStreamEvent =
  | { type: "status"; seq: number; status: "connected" | "ended" | "listening" | "speaking" | "held" | "muted"; reason?: string }
  | { type: "transcript"; seq: number; speaker: "caller" | "twin" | "whisper"; text: string; timestamp: string }
  | { type: "transcript_correction"; seq: number; speaker: string; text: string }
  | {
      type: "whisper";
      seq: number;
      whisper_id: string;
      text: string;
      status: "queued" | "injected" | "spoken" | "failed";
      gold?: boolean;
    }
  | { type: "tool_call"; seq: number; tool: string | null }
  | { type: "ping" };

interface ConnectCallStreamOptions {
  onEvent: (event: CallStreamEvent) => void;
  onClose?: () => void;
}

export interface CallStreamHandle {
  close: () => void;
}

const MAX_BACKOFF_MS = 10_000;

export function connectCallStream(
  callId: string,
  { onEvent, onClose }: ConnectCallStreamOptions,
): CallStreamHandle {
  let closedByCaller = false;
  let socket: WebSocket | null = null;
  let lastSeq = 0;
  let retryDelay = 500;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  function open() {
    const token = getAccessToken() ?? "";
    const base = WS_BASE_URL || window.location.origin.replace(/^http/, "ws");
    const url = `${base}/ws/calls/${callId}?token=${encodeURIComponent(token)}&after=${lastSeq}`;
    socket = new WebSocket(url);

    socket.onopen = () => {
      retryDelay = 500;
    };

    socket.onmessage = (event) => {
      let data: CallStreamEvent;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type !== "ping" && typeof data.seq === "number") {
        lastSeq = data.seq;
      }
      onEvent(data);
    };

    socket.onclose = () => {
      onClose?.();
      if (closedByCaller) return;
      retryTimer = setTimeout(open, retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_BACKOFF_MS);
    };

    socket.onerror = () => {
      socket?.close();
    };
  }

  open();

  return {
    close: () => {
      closedByCaller = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    },
  };
}
