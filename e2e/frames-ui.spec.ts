import { test, expect } from "@playwright/test";
import { rgbaPng } from "./png";

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
