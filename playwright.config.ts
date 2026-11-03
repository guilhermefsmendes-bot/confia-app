import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [["line"]],
  outputDir: "/tmp/confia-playwright-results",
  use: {
    baseURL: "http://127.0.0.1:4174",
    storageState: (() => {
      const now = new Date();
      const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
      const checkIn = { date, mood: 7, need: "calm", completed: true, scaleVersion: 2 };
      return { cookies: [], origins: [{ origin: "http://127.0.0.1:4174", localStorage: [
        { name: "confia_age_18_confirmed_v1", value: "yes" },
        { name: "confia_daily_checkin", value: JSON.stringify(checkIn) },
        { name: "confia_daily_checkin_history", value: JSON.stringify([checkIn]) },
      ] }] };
    })(),
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chromium" } },
    { name: "mobile", use: { ...devices["Pixel 5"], channel: "chromium" } },
  ],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4174",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
