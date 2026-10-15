import { defineConfig } from "@playwright/test";

const remoteBase = process.env.PAF_VISUAL_BASE_URL;

// UI verification runs on Vite only; every API call is intercepted by the tests.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: [
    "premium-workspace.spec.js",
    "experience.spec.js",
    "field-evidence.spec.js",
    "land-team.spec.js",
    "operations-flow.spec.js",
    "access-design.spec.js",
    "access-resilience.spec.js",
    "imported-technician.spec.js",
  ],
  timeout: 30000,
  expect: { timeout: 7000 },
  workers: 1,
  reporter: "line",
  use: {
    baseURL: remoteBase || "http://127.0.0.1:5193",
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: remoteBase
    ? undefined
    : {
        command:
          "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5193 --strictPort",
        url: "http://127.0.0.1:5193",
        reuseExistingServer: true,
      },
});
