"use client";

import * as React from "react";
import Link from "next/link";

import {
  AuthAlert,
  AuthCard,
  AuthFooter,
  AuthHeader,
  InputField,
  SubmitButton,
} from "@/components/auth";
import { useAuthForm } from "@/hooks/use-auth-form";
import { forgotPassword } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [resetToken, setResetToken] = React.useState<string | null>(null);

  const {
    values,
    errors,
    formError,
    status,
    isSubmitting,
    setField,
    setStatus,
    handleSubmit,
  } = useAuthForm({
    initialValues: { email: "" },
    schema: forgotPasswordSchema,
    onSubmit: async (data) => {
      const res = await forgotPassword(data.email);
      setResetToken(res.reset_token);
    },
  });

  if (status === "success") {
    return (
      <AuthCard>
        <AuthHeader
          title="Check your email"
          subtitle={
            <>
              If an account exists for{" "}
              <span className="font-medium text-foreground">
                {values.email}
              </span>
              , a password reset link is on its way.
            </>
          }
        />

        {resetToken ? (
          <AuthAlert variant="info" title="Dev mode">
            Email isn&apos;t wired up — use this link:{" "}
            <Link
              href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
              className="auth-link break-all"
            >
              open reset link
            </Link>
          </AuthAlert>
        ) : null}

        <AuthFooter className="border-t-0 pt-0">
          Didn&apos;t get it?{" "}
          <button
            type="button"
            onClick={() => {
              setResetToken(null);
              setStatus("idle");
            }}
            className="auth-link"
          >
            Try again
          </button>{" "}
          or{" "}
          <Link href="/login" className="auth-link">
            return to sign in
          </Link>
          .
        </AuthFooter>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Forgot your password?"
        subtitle="Enter your email and we'll send you a reset link."
      />

      {formError ? (
        <AuthAlert variant="error" title="Unable to send reset link">
          {formError}
        </AuthAlert>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputField
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          disabled={isSubmitting}
          value={values.email}
          onChange={(event) => setField("email", event.target.value)}
          error={errors.email}
        />

        <SubmitButton loading={isSubmitting} loadingText="Sending link…">
          Send reset link
        </SubmitButton>
      </form>

      <AuthFooter>
        Remembered it?{" "}
        <Link href="/login" className="auth-link">
          Back to sign in
        </Link>
      </AuthFooter>
    </AuthCard>
  );
}
