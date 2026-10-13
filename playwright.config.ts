import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests (spec 13). They run against the production build on an
 * isolated server with a throwaway in-memory database (scripts/e2e-server.mjs),
 * so they never touch real or development data. Build first: `npm run test:e2e`.
 */
const PORT = process.env.E2E_PORT ?? "3100";
const swiftshader = { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] };

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 }, launchOptions: swiftshader } },
  ],
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { E2E_PORT: PORT },
  },
});
