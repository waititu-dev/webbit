import { describe, it, expect } from "vitest";
import { fpsToFrameMs, clampFps } from "./timing";

describe("timing", () => {
  it("converts fps to per-frame milliseconds", () => {
    expect(fpsToFrameMs(25)).toBe(40);
    expect(fpsToFrameMs(10)).toBe(100);
  });
  it("clamps fps into a sane 1-60 range", () => {
    expect(clampFps(0)).toBe(1);
    expect(clampFps(999)).toBe(60);
    expect(clampFps(24)).toBe(24);
  });
});
