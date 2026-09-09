"use client";

import Link from "next/link";

import {
  AuthAlert,
  AuthCard,
  AuthFooter,
  AuthHeader,
  PasswordInput,
  SubmitButton,
} from "@/components/auth";
import { useAuthForm } from "@/hooks/use-auth-form";
import { resetPasswordSchema } from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const { values, errors, formError, status, isSubmitting, setField, handleSubmit } =
    useAuthForm({
      initialValues: { password: "", confirmPassword: "" },
      schema: resetPasswordSchema,
      onSubmit: async () => {
        await new Promise((resolve) => setTimeout(resolve, 900));
      },
    });

  if (status === "success") {
    return (
      <AuthCard>
        <AuthHeader
          title="Password updated"
          subtitle="You can now sign in with your new password."
        />
        <AuthAlert variant="success" title="UI preview">
          No password was actually changed — this screen is not connected to the
          backend yet.
        </AuthAlert>
        <AuthFooter className="border-t-0 pt-0">
          <Link href="/login" className="auth-link">
            Continue to sign in
          </Link>
        </AuthFooter>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Set a new password"
        subtitle="Choose a strong password you don't use elsewhere."
      />

      <AuthAlert variant="info">
        Your reset link token would be validated here before the form is shown.
      </AuthAlert>

      {formError ? (
        <AuthAlert variant="error" title="Unable to reset password">
          {formError}
        </AuthAlert>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <PasswordInput
          label="New password"
          name="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          hint="Use at least 8 characters."
          value={values.password}
          onChange={(event) => setField("password", event.target.value)}
          error={errors.password}
        />

        <PasswordInput
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          value={values.confirmPassword}
          onChange={(event) => setField("confirmPassword", event.target.value)}
          error={errors.confirmPassword}
        />

        <SubmitButton loading={isSubmitting} loadingText="Updating password…">
          Update password
        </SubmitButton>
      </form>

      <AuthFooter>
        <Link href="/login" className="auth-link">
          Back to sign in
        </Link>
      </AuthFooter>
    </AuthCard>
  );
}
