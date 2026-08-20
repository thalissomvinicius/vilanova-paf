import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/pwa",
  timeout: 30000,
  expect: { timeout: 7000 },
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: "chrome",
    serviceWorkers: "allow",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://127.0.0.1:4173/tecnico",
    reuseExistingServer: false,
    timeout: 45000
  }
});
