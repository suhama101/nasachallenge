import { describe, expect, it, vi, beforeEach } from "vitest";
import { isTemporaryAuthError } from "../src/lib/auth/errors";
vi.mock("server-only", () => ({}));
const fixture = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("../src/lib/auth/server", () => ({
  authClient: async () => fixture.client,
}));
import { GET } from "../src/app/auth/session/route";
beforeEach(() => {
  fixture.client = null;
});
describe("verified session status without false logout", () => {
  it.each([0, 429, 500, 502, 503, 504])(
    "temporary Auth status %s never becomes signed out",
    async (status) => {
      fixture.client = {
        auth: {
          getUser: async () => ({ data: { user: null }, error: { status } }),
        },
      };
      const response = await GET();
      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toContain("no-store");
    },
  );
  it.each([400, 401, 403])(
    "invalid/expired Auth status %s is denied",
    async (status) => {
      fixture.client = {
        auth: {
          getUser: async () => ({ data: { user: null }, error: { status } }),
        },
      };
      expect((await GET()).status).toBe(401);
    },
  );
  it("returns only a verified user's ID and no token", async () => {
    fixture.client = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: "fictional-owner",
              email_confirmed_at: "verified",
              access_token: "must-never-return",
            },
          },
          error: null,
        }),
      },
    };
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ userId: "fictional-owner" });
  });
  it("missing configuration and thrown transport errors are unavailable, not expired", async () => {
    expect((await GET()).status).toBe(503);
    fixture.client = {
      auth: {
        getUser: async () => {
          throw new Error("offline");
        },
      },
    };
    expect((await GET()).status).toBe(503);
  });
  it("unconfirmed users are denied and retryable fetch errors are recognized", async () => {
    fixture.client = {
      auth: {
        getUser: async () => ({
          data: { user: { id: "unconfirmed" } },
          error: null,
        }),
      },
    };
    expect((await GET()).status).toBe(401);
    expect(isTemporaryAuthError({ name: "AuthRetryableFetchError" })).toBe(
      true,
    );
    expect(isTemporaryAuthError(null)).toBe(false);
  });
});
