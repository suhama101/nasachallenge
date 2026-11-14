import { NextResponse, type NextRequest } from "next/server";
import { authClient } from "@/lib/auth/server";
import { safeDestination } from "@/lib/auth/validation";
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const client = await authClient();
  let next = "/auth/login?reason=link-expired";
  try {
    if (client) {
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      const result = code
        ? await client.auth.exchangeCodeForSession(code)
        : tokenHash &&
            (type === "signup" || type === "recovery" || type === "email")
          ? await client.auth.verifyOtp({ token_hash: tokenHash, type })
          : null;
      if (result && !result.error) {
        const verified = await client.auth.getUser();
        if (verified.data.user?.email_confirmed_at && !verified.error)
          next =
            type === "recovery"
              ? "/auth/update-password"
              : safeDestination(url.searchParams.get("next"));
      }
    }
  } catch {
    /* Never expose provider errors or echo tokens into another URL. */
  }
  const response = NextResponse.redirect(new URL(next, url.origin), 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
