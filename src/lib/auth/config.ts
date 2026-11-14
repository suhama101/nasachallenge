export type AuthConfig = { url: string; key: string };

// Explicit public credentials only. Privileged keys are never used by this app.
export function readAuthConfig(
  url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
): AuthConfig | null {
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" &&
      !(
        parsed.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(parsed.hostname)
      )
    )
      return null;
    if (
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== "/"
    )
      return null;
    if (!key.startsWith("sb_publishable_")) {
      const payload = JSON.parse(atob(key.split(".")[1] ?? ""));
      if (payload.role !== "anon") return null;
    }
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}

export function authOrigin(): string | null {
  const raw =
    process.env.APP_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )
    )
      return null;
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    // Production email links must return to this existing deployment, not a
    // leftover local origin. Preview/local environments keep their own origin.
    if (
      process.env.VERCEL_ENV === "production" &&
      url.origin !== "https://missionpulse.vercel.app"
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
