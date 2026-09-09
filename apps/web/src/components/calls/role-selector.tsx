"use client";

import { RolePicker } from "@/components/roles/role-picker";

export interface CallRoleSelectorProps {
  value: string[];
  onChange: (roleIds: string[]) => void;
}

/** In-call role picker — the shared RolePicker with call wording. */
export function CallRoleSelector({ value, onChange }: CallRoleSelectorProps) {
  return (
    <RolePicker
      value={value}
      onChange={onChange}
      legend="Call roles"
      description="Roles the Twin uses on this call. Changes take effect on the next turn."
    />
  );
}
