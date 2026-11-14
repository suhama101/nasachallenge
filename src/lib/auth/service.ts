import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/health/database.types";
import { isTemporaryAuthError } from "./errors";
import {
  emailSchema,
  loginSchema,
  newPasswordSchema,
  signupSchema,
  type FormState,
} from "./validation";
export type AuthOperation =
  | "login"
  | "signup"
  | "forgot-password"
  | "update-password"
  | "resend"
  | "logout";
export const genericEmailMessage =
  "If this address is eligible, you will receive an email with the next steps. Check your inbox and spam folder.";
export const unavailableMessage =
  "Astronaut accounts are not connected yet. You can explore the demo without an account; your demo records stay in this browser.";

export async function performAuth(
  client: SupabaseClient<Database> | null,
  operation: AuthOperation,
  values: Record<string, unknown>,
  origin: string | null,
): Promise<FormState> {
  if (operation !== "logout") {
    const schema =
      operation === "signup"
        ? signupSchema
        : operation === "login"
          ? loginSchema
          : operation === "update-password"
            ? newPasswordSchema
            : emailSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success)
      return {
        message: "Check the highlighted fields and try again.",
        errors: Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      };
    values = parsed.data;
  }
  if (!client) return { message: unavailableMessage };
  try {
    if (operation === "logout") {
      const { error } = await client.auth.signOut({ scope: "local" });
      return error
        ? {
            message:
              "We could not confirm sign out. Please retry before leaving this device.",
          }
        : { redirectTo: "/auth/login?reason=signed-out", ok: true };
    }
    if (operation === "login") {
      const { data, error } = await client.auth.signInWithPassword({
        email: String(values.email),
        password: String(values.password),
      });
      if (error || !data.user)
        return {
          message:
            "We could not sign you in. Check your email and password, or use the email help options below.",
        };
      return {
        redirectTo: data.user.email_confirmed_at
          ? "/astronaut"
          : "/auth/verify-email",
        ok: true,
      };
    }
    if (operation === "update-password") {
      const { data, error } = await client.auth.getUser();
      if (isTemporaryAuthError(error))
        return {
          message:
            "Your account connection is temporarily unavailable. Please retry the password update shortly.",
        };
      if (error || !data.user || !data.user.email_confirmed_at)
        return {
          message:
            "This password link has expired. Request a new link to continue.",
        };
      const updated = await client.auth.updateUser({
        password: String(values.password),
      });
      if (updated.error)
        return {
          message:
            "Your password could not be updated. Use a new password or request a fresh link.",
        };
      const signedOut = await client.auth.signOut({ scope: "global" });
      return signedOut.error
        ? {
            message:
              "Password updated, but sign out could not be confirmed. Please sign out before leaving this device.",
            ok: true,
          }
        : { redirectTo: "/auth/login?reason=password-updated", ok: true };
    }
    if (!origin)
      return {
        message:
          "Account email links are not ready yet. Please try again after the site connection is completed, or explore the demo.",
      };
    if (operation === "signup") {
      await client.auth.signUp({
        email: String(values.email),
        password: String(values.password),
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      // Identical response for existing and new accounts, including provider errors.
      return { message: genericEmailMessage, ok: true };
    }
    if (operation === "forgot-password")
      await client.auth.resetPasswordForEmail(String(values.email), {
        redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
      });
    if (operation === "resend")
      await client.auth.resend({
        type: "signup",
        email: String(values.email),
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
    return { message: genericEmailMessage, ok: true };
  } catch {
    if (["signup", "forgot-password", "resend"].includes(operation))
      return { message: genericEmailMessage, ok: true };
    return {
      message:
        "We could not connect to your account. Please try again. No demo records will be used in its place.",
    };
  }
}
