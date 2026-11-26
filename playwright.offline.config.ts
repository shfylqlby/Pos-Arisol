import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "offline.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 390, height: 844 },
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  },
  projects: [{ name: "chromium", use: { ...devices["Pixel 5"] } }],
  webServer: {
    command:
      "node scripts/clean-dir.mjs .next-e2e && pnpm build && node scripts/serve-out.mjs",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      PORT: "3100",
      STATIC_DIR: ".next-e2e",
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_PUBLIC_LOCAL_MODE: "1",
    },
  },
});
