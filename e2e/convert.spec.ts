import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { rgbaPng } from "./png";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Local ffmpeg-core ESM build — works in module workers (app uses {type:"module"} workers).
// UMD build would silently produce undefined .default under dynamic import.
const ffmpegCoreEsmDir = path.resolve(__dirname, "../node_modules/@ffmpeg/core/dist/esm");

async function serveLocalCore(page: Page) {
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
}

const EBML = [0x1a, 0x45, 0xdf, 0xa3];

// Distinct-ish semi-transparent (alpha 128) frames so the encoder exercises the alpha path.
function makeFrames(size: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    name: `frame_${String(i + 1).padStart(4, "0")}.png`,
    mimeType: "image/png",
    buffer: rgbaPng(size, [(i * 37) % 256, (i * 71 + 40) % 256, (i * 113 + 80) % 256, 128]),
  }));
}

async function downloadWebm(page: Page): Promise<Buffer> {
  await expect(page.getByRole("button", { name: /Download WebM/i })).toBeEnabled();
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 175_000 }),
    page.getByRole("button", { name: /Download WebM/i }).click(),
  ]);
  return readFileSync((await download.path())!);
}

test("encodes a PNG sequence to WebM", async ({ page }) => {
  test.setTimeout(180_000);
  await serveLocalCore(page);
  await page.goto("/");
  await page.getByTestId("file-input").setInputFiles(makeFrames(64, 60));
  const buf = await downloadWebm(page);
  console.log("WebM (x60) size:", buf.length, "bytes");
  expect(buf.length).toBeGreaterThan(100);
  expect([...buf.subarray(0, 4)]).toEqual(EBML);
});
