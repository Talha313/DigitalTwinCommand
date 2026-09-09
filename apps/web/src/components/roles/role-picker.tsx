"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { combinedRisk } from "@/lib/role-context";

import { RiskBadge } from "./risk-badge";
import { RoleSelector } from "./role-selector";

export interface RolePickerProps {
  value: string[];
  onChange: (roleIds: string[]) => void;
  legend?: string;
  description?: string;
  align?: "start" | "center" | "end";
  triggerClassName?: string;
}

/**
 * Compact popover wrapper around the shared multi-select RoleSelector.
 * Used by both Chat and Live Calls.
 */
export function RolePicker({
  value,
  onChange,
  legend = "Session roles",
  description,
  align = "end",
  triggerClassName,
}: RolePickerProps) {
  const count = value.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", triggerClassName)}
        >
          {count > 0 ? `${count} role${count > 1 ? "s" : ""}` : "Select roles"}
          {count > 0 ? (
            <RiskBadge level={combinedRisk(value)} showLabel={false} />
          ) : null}
          <ChevronDown
            className="h-3.5 w-3.5 text-muted-foreground"
            aria-hidden
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-80 max-w-[calc(100vw-2rem)]">
        <RoleSelector
          value={value}
          onChange={onChange}
          columns={1}
          legend={legend}
          description={description}
        />
      </PopoverContent>
    </Popover>
  );
}
