import { defineConfig, devices } from "@playwright/test";

const defaultPort = "3000";
const defaultBaseURL = `http://localhost:${defaultPort}`;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? defaultBaseURL;
const parsedBaseURL = new URL(baseURL);
const webServerPort = parsedBaseURL.port || defaultPort;
const webServerHost = parsedBaseURL.hostname;
const isCI = Boolean(process.env.CI);
const requestedWorkers = Number(process.env.PLAYWRIGHT_WORKERS ?? 1);
const workers = Number.isFinite(requestedWorkers) && requestedWorkers > 0 ? requestedWorkers : 1;

export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/playwright-results.json" }],
  ],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_MANAGED_WEBSERVER === "1"
    ? {
        command: `npm run dev -- --hostname ${webServerHost} --port ${webServerPort}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
