import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3333",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
