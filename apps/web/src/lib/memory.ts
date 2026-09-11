/** Memory (training-data review queue) API calls. Types mirror
 * backend/app/models/memories.py. */
import { apiFetch } from "./api-client";

export type MemorySourceType = "chat" | "call" | "whisper" | "document";
export type MemoryStatus = "pending" | "approved" | "rejected";

export interface MemoryRead {
  id: string;
  user_id: string | null;
  content: string;
  source_type: MemorySourceType;
  confidence: number | null;
  status: MemoryStatus;
  created_at: string;
}

export interface MemoryCreate {
  content: string;
  source_type: MemorySourceType;
  confidence?: number;
  user_id?: string;
}

export const SOURCE_LABEL: Record<MemorySourceType, string> = {
  chat: "Chat conversations",
  call: "Voice calls",
  whisper: "Operator whispers",
  document: "Documents",
};

/** Quality tier derived from the real confidence score (0-1) — there is no
 * separate "quality" field on the backend. */
export type DataQuality = "high" | "medium" | "low";

export function qualityFromConfidence(confidence: number | null): DataQuality {
  if (confidence == null) return "medium";
  if (confidence > 0.8) return "high";
  if (confidence > 0.5) return "medium";
  return "low";
}

export function listMemories(status?: MemoryStatus): Promise<MemoryRead[]> {
  const query = status ? `?status=${status}` : "";
  return apiFetch<MemoryRead[]>(`/api/memories${query}`);
}

export function createMemory(input: MemoryCreate): Promise<MemoryRead> {
  return apiFetch<MemoryRead>("/api/memories", { method: "POST", json: input });
}

export function updateMemoryStatus(
  id: string,
  status: MemoryStatus,
): Promise<MemoryRead> {
  return apiFetch<MemoryRead>(`/api/memories/${id}/status`, {
    method: "PATCH",
    json: { status },
  });
}
