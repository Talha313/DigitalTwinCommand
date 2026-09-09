"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import type { ZodType } from "zod";

export type AuthFormStatus = "idle" | "submitting" | "success" | "error";

interface UseAuthFormOptions<TValues extends Record<string, string>> {
  initialValues: TValues;
  schema: ZodType<unknown>;
  /**
   * Submit handler. Not wired to any backend yet — pages pass a short delay to
   * exercise the loading / success states.
   */
  onSubmit: (values: TValues) => Promise<void> | void;
}

export function useAuthForm<TValues extends Record<string, string>>({
  initialValues,
  schema,
  onSubmit,
}: UseAuthFormOptions<TValues>) {
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof TValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthFormStatus>("idle");

  const setField = useCallback((name: keyof TValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }) as TValues);
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setFormError(null);
    setStatus((current) => (current === "error" ? "idle" : current));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const result = schema.safeParse(values);
      if (!result.success) {
        const fieldErrors: Partial<Record<keyof TValues, string>> = {};
        for (const issue of result.error.issues) {
          const key = issue.path[0] as keyof TValues | undefined;
          if (key && !fieldErrors[key]) {
            fieldErrors[key] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }

      setErrors({});
      setFormError(null);
      setStatus("submitting");

      try {
        await onSubmit(values);
        setStatus("success");
      } catch (error) {
        setStatus("error");
        setFormError(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
      }
    },
    [onSubmit, schema, values],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setFormError(null);
    setStatus("idle");
  }, [initialValues]);

  return {
    values,
    errors,
    formError,
    status,
    isSubmitting: status === "submitting",
    setField,
    setStatus,
    handleSubmit,
    reset,
  };
}
