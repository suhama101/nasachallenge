import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  AstronautProfileRow,
} from "../src/lib/health/database.types";
import { performAuth, genericEmailMessage } from "../src/lib/auth/service";
import {
  emailSchema,
  loginSchema,
  signupSchema,
  newPasswordSchema,
  profileSchema,
  safeDestination,
} from "../src/lib/auth/validation";
import { readAuthConfig, authOrigin } from "../src/lib/auth/config";
import { loadProfile, storeProfile } from "../src/lib/auth/profiles";
import { DEMO_PROFILE_ID } from "../src/lib/health/repository";

const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const profile: AstronautProfileRow = {
  id: "11111111-1111-4111-8111-111111111111",
  user_id: owner,
  display_name: "Fixture A",
  crew_identifier: "TEST-A",
  mission_name: "Simulation",
  mission_environment: "space-station",
  mission_start_date: null,
  role: null,
  created_at: "2026-11-14T00:00:00Z",
};
const fields = {
  displayName: "Fixture A",
  crewId: "TEST-A",
  missionName: "Simulation",
  environment: "space-station",
  startDate: "",
  role: "",
};
const credentials = {
  email: "fixture@example.invalid",
  password: "fictional-passphrase",
  confirmPassword: "fictional-passphrase",
};
function fixture(overrides: Record<string, unknown> = {}) {
  const auth = {
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: { id: owner, email_confirmed_at: "now" } },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    resend: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: owner, email_confirmed_at: "now" } },
      error: null,
    }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
  return { auth, client: { auth } as unknown as SupabaseClient<Database> };
}
afterEach(() => vi.unstubAllEnvs());
describe("account validation and public configuration", () => {
  it.each(["", "invalid", "a@", "<script>"])(
    "rejects malformed email %s",
    (email) => expect(emailSchema.safeParse({ email }).success).toBe(false),
  );
  it("validates signup/password confirmation and does not trim passwords", () => {
    expect(
      signupSchema.safeParse({ ...credentials, password: "short" }).success,
    ).toBe(false);
    expect(
      signupSchema.safeParse({ ...credentials, confirmPassword: "different" })
        .success,
    ).toBe(false);
    expect(
      newPasswordSchema.safeParse({
        password: "long enough password ",
        confirmPassword: "long enough password ",
      }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: credentials.email, password: "" }).success,
    ).toBe(false);
  });
  it("validates profile required fields, bounds, environment, optional date and leap days", () => {
    expect(profileSchema.parse(fields)).toMatchObject({
      startDate: "",
      role: "",
    });
    for (const change of [
      { displayName: " " },
      { crewId: "" },
      { missionName: "" },
      { environment: "unknown" },
      { startDate: "2026-02-29" },
      { role: "x".repeat(121) },
    ])
      expect(profileSchema.safeParse({ ...fields, ...change }).success).toBe(
        false,
      );
    expect(
      profileSchema.safeParse({ ...fields, startDate: "2028-02-29" }).success,
    ).toBe(true);
  });
  it("accepts only public credentials and secure or loopback URLs", () => {
    expect(
      readAuthConfig("https://example.invalid", "sb_publishable_fixture"),
    ).not.toBeNull();
    for (const key of [
      "sb_secret_fixture",
      "",
      "service_role",
      `a.${btoa(JSON.stringify({ role: "service_role" }))}.b`,
    ])
      expect(readAuthConfig("https://example.invalid", key)).toBeNull();
    expect(
      readAuthConfig(
        "https://example.invalid",
        `a.${btoa(JSON.stringify({ role: "anon" }))}.b`,
      ),
    ).not.toBeNull();
    expect(
      readAuthConfig("http://example.invalid", "sb_publishable_fixture"),
    ).toBeNull();
    expect(
      readAuthConfig(
        "https://name:password@example.invalid",
        "sb_publishable_fixture",
      ),
    ).toBeNull();
  });
  it.each([
    "https://evil.invalid",
    "//evil.invalid",
    "/\\evil.invalid",
    "/astronaut?owner=other",
    "/demo",
    null,
  ])("constrains callback destination %s", (path) =>
    expect(safeDestination(path)).toBe("/astronaut"),
  );
  it("allows a trusted explicit site origin and rejects unsafe ones", () => {
    vi.stubEnv("APP_URL", "https://missionpulse.example.invalid");
    expect(authOrigin()).toBe("https://missionpulse.example.invalid");
    vi.stubEnv("APP_URL", "http://evil.invalid");
    expect(authOrigin()).toBeNull();
  });
  it("production email links cannot use a leftover local origin", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    expect(authOrigin()).toBeNull();
    vi.stubEnv("APP_URL", "https://missionpulse.vercel.app");
    expect(authOrigin()).toBe("https://missionpulse.vercel.app");
  });
});
describe("mocked Supabase account flows (not real integration)", () => {
  it("checks validation before contacting the provider", async () => {
    const { auth, client } = fixture();
    expect(
      (await performAuth(client, "login", { email: "bad", password: "" }, null))
        .errors,
    ).toHaveProperty("email");
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it("explains missing configuration without claiming account success", async () => {
    const r = await performAuth(
      null,
      "signup",
      credentials,
      "https://example.invalid",
    );
    expect(r.message).toContain("not connected");
    expect(r.ok).not.toBe(true);
  });
  it("uses generic invalid credentials and does not echo provider account detail", async () => {
    const { client } = fixture({
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "User not found" },
      }),
    });
    const r = await performAuth(client, "login", credentials, null);
    expect(r.message).toContain("could not sign you in");
    expect(r.message).not.toContain("not found");
  });
  it("routes verified users to their workspace and unverified users to email help", async () => {
    expect(
      (await performAuth(fixture().client, "login", credentials, null))
        .redirectTo,
    ).toBe("/astronaut");
    const { client } = fixture({
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: owner } }, error: null }),
    });
    expect(
      (await performAuth(client, "login", credentials, null)).redirectTo,
    ).toBe("/auth/verify-email");
  });
  it.each(["signup", "forgot-password", "resend"] as const)(
    "%s has the same public response for existing, missing and failed accounts",
    async (operation) => {
      const a = fixture();
      const b = fixture({
        signUp: vi.fn().mockRejectedValue(Error("exists")),
        resetPasswordForEmail: vi.fn().mockRejectedValue(Error("unknown")),
        resend: vi.fn().mockRejectedValue(Error("unknown")),
      });
      const first = await performAuth(
        a.client,
        operation,
        credentials,
        "https://example.invalid",
      );
      expect(first.message).toBe(genericEmailMessage);
      expect(
        await performAuth(
          b.client,
          operation,
          credentials,
          "https://example.invalid",
        ),
      ).toEqual(first);
    },
  );
  it("uses the trusted origin for email links and requires it", async () => {
    const { auth, client } = fixture();
    await performAuth(
      client,
      "forgot-password",
      credentials,
      "https://example.invalid",
    );
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(credentials.email, {
      redirectTo:
        "https://example.invalid/auth/callback?next=/auth/update-password",
    });
    expect(
      (await performAuth(client, "signup", credentials, null)).ok,
    ).not.toBe(true);
  });
  it("logout is a real provider operation and failure does not claim success", async () => {
    const { auth, client } = fixture();
    expect(
      (await performAuth(client, "logout", {}, null)).redirectTo,
    ).toContain("signed-out");
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    auth.signOut.mockResolvedValueOnce({ error: new Error("offline") });
    expect(
      (await performAuth(client, "logout", {}, null)).redirectTo,
    ).toBeUndefined();
  });
  it("expired sessions cannot update a password", async () => {
    const { auth, client } = fixture({
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error("expired"),
      }),
    });
    expect(
      (await performAuth(client, "update-password", credentials, null)).message,
    ).toContain("expired");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("password reset verifies identity, updates the password, and revokes sessions", async () => {
    const { auth, client } = fixture();
    expect(
      (await performAuth(client, "update-password", credentials, null))
        .redirectTo,
    ).toContain("password-updated");
    expect(auth.updateUser).toHaveBeenCalledWith({
      password: credentials.password,
    });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
  });
});
function databaseFixture(row: AstronautProfileRow | null = profile) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profile, error: null }),
  };
  return {
    query,
    client: { from: vi.fn(() => query) } as unknown as SupabaseClient<Database>,
  };
}
describe("owned profile repository", () => {
  it("filters profile reads by server-verified owner", async () => {
    const { query, client } = databaseFixture();
    expect(await loadProfile(client, owner)).toEqual(profile);
    expect(query.eq).toHaveBeenCalledWith("user_id", owner);
  });
  it.each([
    { ...profile, user_id: other },
    { ...profile, id: DEMO_PROFILE_ID },
  ])("rejects cross-user or fictional profile responses", async (row) =>
    expect(loadProfile(databaseFixture(row).client, owner)).rejects.toThrow(
      "ownership",
    ),
  );
  it("keeps a new account empty instead of substituting a demo profile", async () =>
    expect(await loadProfile(databaseFixture(null).client, owner)).toBeNull());
  it("inserts only the verified owner and ignores caller-supplied owner IDs", async () => {
    const { query, client } = databaseFixture(null);
    await storeProfile(client, owner, {
      ...fields,
      user_id: other,
      id: DEMO_PROFILE_ID,
    } as never);
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: owner,
        display_name: "Fixture A",
        mission_start_date: null,
      }),
    );
    expect(query.insert.mock.calls[0][0]).not.toHaveProperty("id");
  });
  it("edits only owned fields with both owner and profile filters", async () => {
    const { query, client } = databaseFixture();
    await storeProfile(client, owner, fields as never);
    expect(query.eq).toHaveBeenCalledWith("user_id", owner);
    expect(query.eq).toHaveBeenCalledWith("id", profile.id);
    expect(query.update.mock.calls[0][0]).not.toHaveProperty("user_id");
  });
  it("connection errors are surfaced instead of fictional fallback", async () => {
    const { query, client } = databaseFixture();
    query.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: new Error("offline"),
    } as never);
    await expect(loadProfile(client, owner)).rejects.toThrow(
      "could not be loaded",
    );
  });
});
