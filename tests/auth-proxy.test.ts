import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const setup = vi.hoisted(() => ({
  run: (options: unknown) => { void options; return Promise.resolve(); },
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: unknown) => ({
    auth: { getUser: () => setup.run(options) },
  }),
}));
import { proxy } from "../src/proxy";
type CookieSetup = {
  cookies: {
    setAll: (
      values: {
        name: string;
        value: string;
        options: { path: string; maxAge?: number };
      }[],
      headers: Record<string, string>,
    ) => void;
  };
};
afterEach(() => vi.unstubAllEnvs());
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:4400");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_fixture");
});
it("Proxy preserves refreshed request cookies, all response writes and anti-cache headers", async () => {
  setup.run = async (options) => {
    const value = options as CookieSetup;
    value.cookies.setAll(
      [
        {
          name: "fixture-session.0",
          value: "refreshed-part",
          options: { path: "/" },
        },
      ],
      { Pragma: "no-cache" },
    );
    value.cookies.setAll(
      [
        {
          name: "fixture-session.1",
          value: "second-part",
          options: { path: "/" },
        },
      ],
      {},
    );
  };
  const request = new NextRequest(
    "http://localhost:3000/astronaut/health-history",
  );
  const response = await proxy(request);
  expect(request.cookies.get("fixture-session.0")?.value).toBe(
    "refreshed-part",
  );
  expect(response.cookies.get("fixture-session.0")?.value).toBe(
    "refreshed-part",
  );
  expect(response.cookies.get("fixture-session.1")?.value).toBe("second-part");
  expect(response.headers.get("pragma")).toBe("no-cache");
  expect(response.headers.get("cache-control")).toContain("no-store");
});
