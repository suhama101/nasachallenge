import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readAuthConfig } from "@/lib/auth/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = readAuthConfig();
  if (config) {
    const authHeaders: Record<string, string> = {};
    const client = createServerClient(config.url, config.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          const previousCookies = response.cookies.getAll();
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          previousCookies.forEach((cookie) => response.cookies.set(cookie));
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.assign(authHeaders, headers ?? {});
          Object.entries(authHeaders).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    });
    try {
      await client.auth.getUser();
    } catch {
      /* The data access layer fails closed. */
    }
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set(
    "Referrer-Policy",
    request.nextUrl.pathname === "/auth/callback"
      ? "no-referrer"
      : "same-origin",
  );
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
export const config = { matcher: ["/astronaut/:path*", "/auth/:path*"] };
