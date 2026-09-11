"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  AuthAlert,
  AuthCard,
  AuthFooter,
  AuthHeader,
  PasswordInput,
  SubmitButton,
} from "@/components/auth";
import { useAuthForm } from "@/hooks/use-auth-form";
import { resetPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token");

  const { values, errors, formError, status, isSubmitting, setField, handleSubmit } =
    useAuthForm({
      initialValues: { password: "", confirmPassword: "" },
      schema: resetPasswordSchema,
      onSubmit: async (data) => {
        await resetPassword({ token: token ?? "", password: data.password });
      },
    });

  if (!token) {
    return (
      <AuthCard>
        <AuthHeader
          title="Invalid reset link"
          subtitle="This link is missing its token. Request a new one."
        />
        <AuthFooter className="border-t-0 pt-0">
          <Link href="/forgot-password" className="auth-link">
            Request a new reset link
          </Link>
        </AuthFooter>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard>
        <AuthHeader
          title="Password updated"
          subtitle="You can now sign in with your new password."
        />
        <AuthAlert variant="success" title="Done">
          Your password has been reset.
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
