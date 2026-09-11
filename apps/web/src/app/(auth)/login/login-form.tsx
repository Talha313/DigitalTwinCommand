"use client";

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
import { useAuthForm } from "@/hooks/use-auth-form";
import { login } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();

  const { values, errors, formError, isSubmitting, setField, handleSubmit } =
    useAuthForm({
      initialValues: { email: "", password: "" },
      schema: loginSchema,
      onSubmit: async (data) => {
        await login({ email: data.email, password: data.password });
        router.push("/dashboard");
        router.refresh();
      },
    }); 

  return (
    <AuthCard>
      <AuthHeader
        title="Sign in"
        subtitle="Access your Digital Twin Command Center."
      />

      {formError ? (
        <AuthAlert variant="error" title="Unable to sign in">
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

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
          value={values.password}
          onChange={(event) => setField("password", event.target.value)}
          error={errors.password}
          labelAction={
            <Link href="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          }
        />

        <SubmitButton loading={isSubmitting} loadingText="Signing in…">
          Sign in
        </SubmitButton>
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
