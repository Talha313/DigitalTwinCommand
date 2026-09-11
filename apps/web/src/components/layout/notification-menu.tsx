"use client";

import * as React from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusDot } from "@/components/ui/status-dot";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRead,
} from "@/lib/notifications";

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function NotificationMenu() {
  const [items, setItems] = React.useState<NotificationRead[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  const refresh = React.useCallback(() => {
    listNotifications()
      .then(setItems)
      .catch(() => {
        /* leave whatever we had — the bell isn't critical UI */
      })
      .finally(() => setLoaded(true));
  }, []);

  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const unread = items.filter((item) => !item.read_at).length;

  const openItem = async (item: NotificationRead) => {
    if (!item.read_at) {
      try {
        const updated = await markNotificationRead(item.id);
        setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      } catch {
        /* non-fatal */
      }
    }
    if (item.url) window.location.href = item.url;
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      refresh();
    } catch {
      /* non-fatal */
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unread > 0 ? (
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
              aria-hidden
            />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm">Notifications</DropdownMenuLabel>
          {unread > 0 ? (
            <span className="text-xs text-muted-foreground">{unread} unread</span>
          ) : null}
        </div>
        <DropdownMenuSeparator className="my-0" />
        {!loaded ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-border/60 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-accent"
                >
                  <StatusDot tone={item.read_at ? "neutral" : "positive"} className="mt-1.5" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    {item.body ? (
                      <p className="truncate text-xs text-muted-foreground">{item.body}</p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      {timeLabel(item.created_at)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        <DropdownMenuSeparator className="my-0" />
        <div className="p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs text-muted-foreground"
            onClick={markAll}
            disabled={unread === 0}
          >
            Mark all as read
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
