"use server";
import { authClient } from "@/lib/auth/server";
import { authOrigin } from "@/lib/auth/config";
import { performAuth, type AuthOperation } from "@/lib/auth/service";
import { profileSchema, type FormState } from "@/lib/auth/validation";
import { storeProfile } from "@/lib/auth/profiles";
import { isTemporaryAuthError } from "@/lib/auth/errors";

export async function accountAction(
  operation: AuthOperation,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (
    ![
      "login",
      "signup",
      "forgot-password",
      "update-password",
      "resend",
      "logout",
    ].includes(operation)
  )
    return { message: "Choose an account action and try again." };
  return performAuth(
    await authClient(),
    operation,
    Object.fromEntries(form),
    authOrigin(),
  );
}
export async function profileAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const client = await authClient();
  if (!client)
    return {
      message:
        "Your account connection is not ready. Your profile has not been saved.",
    };
  try {
    const { data, error } = await client.auth.getUser();
    if (isTemporaryAuthError(error))
      return {
        message:
          "Your account connection is temporarily unavailable. Your profile has not been changed. Please retry.",
      };
    if (error || !data.user)
      return { redirectTo: "/auth/login?reason=session" };
    if (!data.user.email_confirmed_at)
      return { redirectTo: "/auth/verify-email" };
    const parsed = profileSchema.safeParse(Object.fromEntries(form));
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
    await storeProfile(client, data.user.id, parsed.data);
    return { redirectTo: "/astronaut?profile=saved", ok: true };
  } catch {
    return {
      message:
        "Your profile could not be saved. Your entries are still here; please try again.",
    };
  }
}
