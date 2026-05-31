import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const crossOriginHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
};

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { headers: crossOriginHeaders },
  preview: { headers: crossOriginHeaders },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.ts",
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
