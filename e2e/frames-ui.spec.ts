import { test, expect } from "@playwright/test";
import { deflateSync } from "node:zlib";

const crcTable = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b: Buffer) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type: string, data: Buffer) { const l = Buffer.alloc(4); l.writeUInt32BE(data.length, 0); const t = Buffer.from(type, "ascii"); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(Buffer.concat([t, data])), 0); return Buffer.concat([l, t, data, cr]); }
function rgbaPng(size: number, rgba: [number, number, number, number]) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  const row = Buffer.concat([Buffer.from([0]), ...Array(size).fill(Buffer.from(rgba))]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(Buffer.concat(Array(size).fill(row)))), chunk("IEND", Buffer.alloc(0))]);
}
const frames = Array.from({ length: 40 }, (_, i) => ({
  name: `frame_${String(i + 1).padStart(3, "0")}.png`,
  mimeType: "image/png",
  buffer: rgbaPng(48, [(i * 13) % 256, 120, 210, 255]),
}));

test("frame count + collapse toggle", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto("/");
  await page.getByTestId("file-input").setInputFiles(frames);

  await expect(page.getByText("40 frames", { exact: true })).toBeVisible();
  const toggle = page.getByRole("button", { name: /See more/i });
  await expect(toggle).toBeVisible();
  await page.screenshot({ path: "screenshots/frames-collapsed.png" });

  await toggle.click();
  await expect(page.getByRole("button", { name: /Show fewer/i })).toBeVisible();
  await page.screenshot({ path: "screenshots/frames-expanded.png", fullPage: true });
});
