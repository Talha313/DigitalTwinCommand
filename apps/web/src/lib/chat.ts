/**
 * Chat + conversations API calls. Types mirror
 * backend/app/models/conversations.py and backend/app/models/chat.py.
 */
import { apiFetch } from "./api-client";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export type MessageRole = "user" | "assistant" | "system";

export interface MessageRead {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface ConversationListItem {
  id: string;
  user_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
  role_ids: string[];
  message_count: number;
}

export interface ConversationRead {
  id: string;
  user_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
  role_ids: string[];
  messages: MessageRead[];
}

export function listConversations(): Promise<ConversationListItem[]> {
  return apiFetch<ConversationListItem[]>("/api/conversations");
}

export function createConversation(input: {
  title?: string;
  role_ids?: string[];
} = {}): Promise<ConversationRead> {
  return apiFetch<ConversationRead>("/api/conversations", {
    method: "POST",
    json: input,
  });
}

export function getConversation(conversationId: string): Promise<ConversationRead> {
  return apiFetch<ConversationRead>(`/api/conversations/${conversationId}`);
}

export function updateConversationTitle(
  conversationId: string,
  title: string,
): Promise<ConversationRead> {
  return apiFetch<ConversationRead>(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    json: { title },
  });
}

export function deleteConversation(conversationId: string): Promise<void> {
  return apiFetch<void>(`/api/conversations/${conversationId}`, {
    method: "DELETE",
  });
}

export function setConversationRoles(
  conversationId: string,
  roleIds: string[],
): Promise<ConversationRead> {
  return apiFetch<ConversationRead>(`/api/conversations/${conversationId}/roles`, {
    method: "PUT",
    json: { role_ids: roleIds },
  });
}

export function listMessages(conversationId: string): Promise<MessageRead[]> {
  return apiFetch<MessageRead[]>(`/api/conversations/${conversationId}/messages`);
}

/**
 * Persists a plain (non-streamed) user message. NOTE: this always persists
 * as role "user" — it does not produce or trigger an assistant reply. Use
 * `streamChat` to actually talk to the twin; it persists both the user turn
 * and the assistant reply itself, so don't call this immediately before it
 * or the user's turn will be duplicated.
 */
export function postMessage(
  conversationId: string,
  content: string,
  meta?: Record<string, unknown>,
): Promise<MessageRead> {
  return apiFetch<MessageRead>(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    json: { content, meta },
  });
}

// --- streaming chat --------------------------------------------------------

export interface StreamChatPayload {
  conversation_id?: string;
  content: string;
  role_ids?: string[];
  /** Only used if a new conversation is created (conversation_id omitted). */
  title?: string;
}

export type ChatStreamEvent =
  | { type: "start"; conversation_id: string }
  | { type: "delta"; text: string }
  | { type: "done"; conversation_id: string; message_id: string; text: string }
  | { type: "error"; error: string };

/** UI-level chat message — assembled from real MessageRead rows plus, for
 * the in-progress assistant turn, live `delta` chunks from streamChat(). */
export interface UiChatMessage {
  id: string;
  author: "user" | "twin";
  content: string;
  timestamp: string;
  /** True only for the assistant bubble currently receiving delta chunks. */
  streaming?: boolean;
  /** True for a stream that ended in an {type:"error"} event. */
  error?: boolean;
}

export interface StreamChatHandle {
  /** Resolves once the terminal (done/error) event has been delivered to `onEvent`. */
  done: Promise<void>;
  /** Aborts the underlying fetch; no further events fire after this. */
  abort: () => void;
}

/**
 * POST /api/chat/stream — reads the SSE-over-fetch response body directly
 * (no EventSource, since this is a POST with a JSON body) and parses
 * `data: {...}\n\n` frames, dispatching each parsed payload to `onEvent`.
 *
 * The backend always responds 200 and reports failures as an in-stream
 * `{type: "error"}` event (e.g. when XAI_API_KEY is unset) — that is
 * not a wiring bug, just the model provider being unavailable. A genuine
 * network/auth failure before any bytes are parsed also surfaces as an
 * `{type: "error"}` event so callers only need one failure path.
 */
export function streamChat(
  payload: StreamChatPayload,
  { onEvent }: { onEvent: (event: ChatStreamEvent) => void },
): StreamChatHandle {
  const controller = new AbortController();

  const done = (async () => {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/api/chat/stream`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted) return;
      onEvent({ type: "error", error: "Could not reach the server." });
      return;
    }

    if (!response.ok || !response.body) {
      onEvent({
        type: "error",
        error: `Chat stream request failed (${response.status}).`,
      });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        buffer += decoder.decode(value, { stream: true });

        let sepIndex = buffer.indexOf("\n\n");
        while (sepIndex !== -1) {
          const rawEvent = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);

          const dataLine = rawEvent
            .split("\n")
            .find((line) => line.startsWith("data:"));
          const jsonText = dataLine?.slice(5).trim();
          if (jsonText) {
            try {
              onEvent(JSON.parse(jsonText) as ChatStreamEvent);
            } catch {
              /* skip malformed frame */
            }
          }

          sepIndex = buffer.indexOf("\n\n");
        }
      }
    } catch {
      if (!controller.signal.aborted) {
        onEvent({ type: "error", error: "Chat stream connection was lost." });
      }
    }
  })();

  return {
    done,
    abort: () => controller.abort(),
  };
}
