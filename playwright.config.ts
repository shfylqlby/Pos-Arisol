import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "offline.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3002",
    trace: "on-first-retry",
    viewport: { width: 390, height: 844 },
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  },
  projects: [{ name: "chromium", use: { ...devices["Pixel 5"] } }],
  webServer: {
    command: "node scripts/clean-dir.mjs .next-e2e && pnpm dev",
    url: "http://127.0.0.1:3002",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      PORT: "3002",
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_PUBLIC_LOCAL_MODE: "1",
    },
  },
});
