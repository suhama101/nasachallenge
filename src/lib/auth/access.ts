import "server-only";
import { redirect } from "next/navigation";
import { authClient } from "./server";
import { loadProfile } from "./profiles";
import { isTemporaryAuthError } from "./errors";

export async function astronautAccess() {
  const client = await authClient();
  if (!client) return { kind: "configuration" as const };
  let result;
  try {
    result = await client.auth.getUser();
  } catch {
    return { kind: "connection" as const };
  }
  if (result.error || !result.data.user) {
    // Invalid/revoked/expired sessions never authorize a private query.
    if (isTemporaryAuthError(result.error))
      return { kind: "connection" as const };
    redirect("/auth/login?reason=session");
  }
  const user = result.data.user;
  if (!user.email_confirmed_at) redirect("/auth/verify-email");
  try {
    const profile = await loadProfile(client, user.id);
    return { kind: "ready" as const, user, profile };
  } catch {
    return { kind: "profile-error" as const };
  }
}
