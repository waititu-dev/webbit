import { defineConfig } from "@playwright/test";

// Set WEBBIT_URL to run the suite against a deployed site instead of a local build.
const deployedURL = process.env.WEBBIT_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  fullyParallel: false,
  use: { baseURL: deployedURL ?? "http://localhost:4173", acceptDownloads: true },
  webServer: deployedURL
    ? undefined
    : {
        command: "npm run build && npm run preview -- --port 4173 --strictPort",
        url: "http://localhost:4173",
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
