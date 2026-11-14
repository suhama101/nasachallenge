import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/auth-e2e",
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  outputDir: "test-results/auth",
  use: {
    baseURL: "http://localhost:3102",
    channel: "msedge",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: [
    {
      command: "node tests/support/auth-fixture.mjs",
      url: "http://127.0.0.1:4400/__fixture/ready",
      reuseExistingServer: false,
    },
    {
      command: "node tests/support/start-auth-app.mjs",
      url: "http://localhost:3102/welcome",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:4400",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          "sb_publishable_fictional_test_only",
        APP_URL: "http://localhost:3102",
      },
    },
  ],
});
