import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testDir: "./tests/no-key-e2e",
  outputDir: "test-results/no-key",
  use: { ...base.use, baseURL: "http://localhost:3102" },
  webServer: {
    command: "node tests/support/start-auth-app.mjs",
    url: "http://localhost:3102/welcome",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      APP_URL: "http://localhost:3102",
    },
  },
});
