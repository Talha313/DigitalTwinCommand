"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings as SettingsIcon, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStoredUser, logout, type AuthUser } from "@/lib/auth";

const FALLBACK = {
  name: "Operator",
  email: "",
  role: "Operator",
  initials: "OP",
};

function toDisplay(user: AuthUser | null): typeof FALLBACK {
  if (!user) return FALLBACK;
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const name = full || user.email.split("@")[0] || FALLBACK.name;
  const initials =
    (full
      ? full
          .split(/\s+/)
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
      : name.slice(0, 2)
    ).toUpperCase() || FALLBACK.initials;
  const role = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  return { name, email: user.email, role, initials };
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const display = toDisplay(user);

  async function handleSignOut() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 px-1.5 sm:pr-3"
          aria-label="Open user menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>{display.initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-left leading-tight sm:flex sm:flex-col">
            <span className="text-sm font-medium text-foreground">
              {display.name}
            </span>
            <span className="text-xs text-muted-foreground">{display.role}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium text-foreground">
            {display.name}
          </span>
          {display.email ? (
            <span className="block truncate text-xs text-muted-foreground">
              {display.email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <UserRound />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void handleSignOut();
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
