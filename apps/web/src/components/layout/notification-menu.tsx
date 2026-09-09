"use client";

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

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Investor call completed",
    detail: "Financial Twin · 12:35 duration",
    time: "10:45",
    unread: true,
  },
  {
    id: "n2",
    title: "Daily market report ready",
    detail: "16:9 and 9:16 renders available",
    time: "10:30",
    unread: true,
  },
  {
    id: "n3",
    title: "Financial role assigned",
    detail: "Applied to the active session",
    time: "10:15",
    unread: false,
  },
];

export function NotificationMenu() {
  const unread = MOCK_NOTIFICATIONS.filter((item) => item.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
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
          <DropdownMenuLabel className="p-0 text-sm">
            Notifications
          </DropdownMenuLabel>
          {unread > 0 ? (
            <span className="text-xs text-muted-foreground">
              {unread} unread
            </span>
          ) : null}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <ul className="max-h-80 divide-y divide-border/60 overflow-y-auto">
          {MOCK_NOTIFICATIONS.map((item) => (
            <li key={item.id} className="flex gap-3 px-3 py-3">
              <StatusDot
                tone={item.unread ? "positive" : "neutral"}
                className="mt-1.5"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.detail}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                  {item.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <DropdownMenuSeparator className="my-0" />
        <div className="p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs text-muted-foreground"
          >
            View all activity
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
