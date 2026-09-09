"use client";

import { RolePicker } from "@/components/roles/role-picker";

export interface ChatRoleSelectorProps {
  value: string[];
  onChange: (roleIds: string[]) => void;
}

/** In-chat role picker — the shared RolePicker with chat wording. */
export function ChatRoleSelector({ value, onChange }: ChatRoleSelectorProps) {
  return (
    <RolePicker
      value={value}
      onChange={onChange}
      legend="Session roles"
      description="Applied to new messages in this conversation."
    />
  );
}
