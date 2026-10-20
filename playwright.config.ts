import { defineConfig, devices } from "@playwright/test";

// Browser tests run against the production build (`npm run build` first).
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    // Phone-sized layout (Chromium with a mobile viewport and touch).
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@layout/ },
    // Classroom projectors: a common 1024×768 projector and a 1080p display at 150 % zoom.
    { name: "projector-xga", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } }, grep: /@layout/ },
    {
      name: "projector-1080p-zoom",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 },
      grep: /@layout/,
    },
  ],
});
