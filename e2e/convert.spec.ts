import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { solidPng } from "./png";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const frames = [
  { name: "frame_001.png", mimeType: "image/png", buffer: solidPng(32, [220, 40, 40]) },
  { name: "frame_002.png", mimeType: "image/png", buffer: solidPng(32, [40, 200, 80]) },
  { name: "frame_003.png", mimeType: "image/png", buffer: solidPng(32, [40, 80, 220]) },
  { name: "frame_004.png", mimeType: "image/png", buffer: solidPng(32, [230, 200, 40]) },
];

// Local ffmpeg-core ESM build — works in module workers (app uses {type:"module"} workers).
// UMD build would silently produce undefined .default under dynamic import.
const ffmpegCoreEsmDir = path.resolve(__dirname, "../node_modules/@ffmpeg/core/dist/esm");

test("converts a PNG sequence to animated WebP and GIF", async ({ page }) => {
  // Serve local ffmpeg-core files instead of CDN to avoid network dependency.
  // Must be the ESM build because the app's Vite bundle creates module workers.
  await page.route("**/cdn.jsdelivr.net/npm/@ffmpeg/core**/ffmpeg-core.js", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/javascript",
      headers: { "Cross-Origin-Resource-Policy": "cross-origin" },
      body: readFileSync(path.join(ffmpegCoreEsmDir, "ffmpeg-core.js")),
    });
  });
  await page.route("**/cdn.jsdelivr.net/npm/@ffmpeg/core**/ffmpeg-core.wasm", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/wasm",
      headers: { "Cross-Origin-Resource-Policy": "cross-origin" },
      body: readFileSync(path.join(ffmpegCoreEsmDir, "ffmpeg-core.wasm")),
    });
  });

  await page.goto("/");
  await page.getByTestId("file-input").setInputFiles(frames);
  await expect(page.getByRole("button", { name: /Download WebP/i })).toBeEnabled();

  const [webp] = await Promise.all([
    page.waitForEvent("download", { timeout: 150_000 }),
    page.getByRole("button", { name: /Download WebP/i }).click(),
  ]);
  const webpBuf = readFileSync((await webp.path())!);
  console.log("WebP size:", webpBuf.length, "bytes");
  expect(webpBuf.length).toBeGreaterThan(100);
  expect(webpBuf.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(webpBuf.subarray(8, 12).toString("ascii")).toBe("WEBP");

  const [gif] = await Promise.all([
    page.waitForEvent("download", { timeout: 150_000 }),
    page.getByRole("button", { name: /Download GIF/i }).click(),
  ]);
  const gifBuf = readFileSync((await gif.path())!);
  console.log("GIF size:", gifBuf.length, "bytes");
  expect(gifBuf.subarray(0, 6).toString("ascii")).toMatch(/^GIF8[79]a$/);
});
