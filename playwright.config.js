import { defineConfig } from "@playwright/test";
const baseURL = process.env.PAF_E2E_BASE_URL || "http://127.0.0.1:5173";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL,
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev",
    url: `${baseURL}/api/health`,
    env: { PORT: new URL(baseURL).port || "5173" },
    reuseExistingServer: true,
    timeout: 30000
  }
});
