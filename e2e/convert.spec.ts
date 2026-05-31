import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { rgbaPng } from "./png";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Semi-transparent frames (alpha < 255) so the encoder actually exercises the alpha path.
const frames = [
  { name: "frame_001.png", mimeType: "image/png", buffer: rgbaPng(32, [220, 40, 40, 128]) },
  { name: "frame_002.png", mimeType: "image/png", buffer: rgbaPng(32, [40, 200, 80, 128]) },
  { name: "frame_003.png", mimeType: "image/png", buffer: rgbaPng(32, [40, 80, 220, 128]) },
  { name: "frame_004.png", mimeType: "image/png", buffer: rgbaPng(32, [230, 200, 40, 128]) },
];

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

// Drive the UI through a full PNG-sequence → WebM export and return the downloaded bytes.
// vp8: true clicks the VP8 codec toggle first; otherwise the default (VP9) is used.
async function exportWebm(page: Page, opts: { vp8?: boolean } = {}): Promise<Buffer> {
  await serveLocalCore(page);

  await page.goto("/");
  await page.getByTestId("file-input").setInputFiles(frames);
  if (opts.vp8) {
    await page.getByRole("button", { name: /VP8/i }).click();
  }
  await expect(page.getByRole("button", { name: /Download WebM/i })).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 180_000 }),
    page.getByRole("button", { name: /Download WebM/i }).click(),
  ]);
  return readFileSync((await download.path())!);
}

test("converts a PNG sequence to WebM (VP9)", async ({ page }) => {
  test.setTimeout(180_000);
  const buf = await exportWebm(page);
  console.log("WebM (VP9) size:", buf.length, "bytes");
  expect(buf.length).toBeGreaterThan(100);
  expect([...buf.subarray(0, 4)]).toEqual(EBML);
});

test("converts a PNG sequence to WebM (VP8)", async ({ page }) => {
  test.setTimeout(180_000);
  const buf = await exportWebm(page, { vp8: true });
  console.log("WebM (VP8) size:", buf.length, "bytes");
  expect(buf.length).toBeGreaterThan(100);
  expect([...buf.subarray(0, 4)]).toEqual(EBML);
});
