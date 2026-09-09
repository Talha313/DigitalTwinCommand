"use client";

import Link from "next/link";

import {
  AuthAlert,
  AuthCard,
  AuthFooter,
  AuthHeader,
  InputField,
  PasswordInput,
  SubmitButton,
} from "@/components/auth";
import { useAuthForm } from "@/hooks/use-auth-form";
import { signupSchema } from "@/lib/validations/auth";

export function SignupForm() {
  const { values, errors, formError, status, isSubmitting, setField, handleSubmit } =
    useAuthForm({
      initialValues: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
      schema: signupSchema,
      onSubmit: async () => {
        await new Promise((resolve) => setTimeout(resolve, 900));
      },
    });

  return (
    <AuthCard>
      <AuthHeader
        title="Create your account"
        subtitle="Set up operator access to the command center."
      />

      {status === "success" ? (
        <AuthAlert variant="info" title="UI preview">
          Account creation isn&apos;t connected yet — this screen validates input
          and exercises form state only.
        </AuthAlert>
      ) : null}

      {formError ? (
        <AuthAlert variant="error" title="Unable to create account">
          {formError}
        </AuthAlert>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          required
          disabled={isSubmitting}
          value={values.name}
          onChange={(event) => setField("name", event.target.value)}
          error={errors.name}
        />

        <InputField
          label="Work email"
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

        <PasswordInput
          label="Password"
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
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          value={values.confirmPassword}
          onChange={(event) => setField("confirmPassword", event.target.value)}
          error={errors.confirmPassword}
        />

        <SubmitButton loading={isSubmitting} loadingText="Creating account…">
          Create account
        </SubmitButton>
      </form>

      <AuthFooter>
        Already have an account?{" "}
        <Link href="/login" className="auth-link">
          Sign in
        </Link>
      </AuthFooter>
    </AuthCard>
  );
}
