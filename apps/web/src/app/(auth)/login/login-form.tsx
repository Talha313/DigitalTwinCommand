"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AuthAlert,
  AuthCard,
  AuthFooter,
  AuthHeader,
  InputField,
  PasswordInput,
  SubmitButton,
} from "@/components/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // UI preview: no validation, no API call — go straight to the dashboard.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/dashboard");
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Sign in"
        subtitle="Access your Digital Twin Command Center."
      />

      <AuthAlert variant="info" title="UI preview">
        Authentication isn&apos;t connected yet — any credentials continue to the
        dashboard.
      </AuthAlert>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputField
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          labelAction={
            <Link href="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          }
        />

        <SubmitButton>Sign in</SubmitButton>
      </form>

      <AuthFooter>
        New to the platform?{" "}
        <Link href="/signup" className="auth-link">
          Create an account
        </Link>
      </AuthFooter>
    </AuthCard>
  );
}
