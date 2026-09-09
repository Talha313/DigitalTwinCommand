import { z } from "zod";

/**
 * Client-side auth validation schemas.
 *
 * These are UI validation placeholders only. Server-side validation and the
 * canonical request/response contracts live in `packages/shared` and are wired
 * in a later phase.
 */

const email = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters");

const withPasswordConfirmation = {
  password: strongPassword,
  confirmPassword: z.string().min(1, "Confirm your password"),
};

const passwordsMatch: { path: (string | number)[]; message: string } = {
  path: ["confirmPassword"],
  message: "Passwords do not match",
};

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email,
    ...withPasswordConfirmation,
  })
  .refine((values) => values.password === values.confirmPassword, passwordsMatch);
export type SignupValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ ...withPasswordConfirmation })
  .refine((values) => values.password === values.confirmPassword, passwordsMatch);
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
