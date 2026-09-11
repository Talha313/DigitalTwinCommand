/** In-app notifications API calls. Types mirror
 * backend/app/models/notifications.py. */
import { apiFetch } from "./api-client";

export interface NotificationRead {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  tag: string | null;
  read_at: string | null;
  created_at: string;
}

export function listNotifications(): Promise<NotificationRead[]> {
  return apiFetch<NotificationRead[]>("/api/notifications");
}

export function markNotificationRead(id: string): Promise<NotificationRead> {
  return apiFetch<NotificationRead>(`/api/notifications/${id}/read`, {
    method: "POST",
  });
}

export function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>("/api/notifications/mark-all-read", { method: "POST" });
}
