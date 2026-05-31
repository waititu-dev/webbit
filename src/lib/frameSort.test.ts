import { describe, it, expect } from "vitest";
import { frameSort } from "./frameSort";

const names = (fs: File[]) => fs.map((f) => f.name);
const mk = (name: string) => new File([new Uint8Array()], name, { type: "image/png" });

describe("frameSort", () => {
  it("orders numeric suffixes naturally, not lexically", () => {
    const input = [mk("frame_10.png"), mk("frame_2.png"), mk("frame_1.png")];
    expect(names(frameSort(input))).toEqual(["frame_1.png", "frame_2.png", "frame_10.png"]);
  });
  it("handles zero-padded names", () => {
    const input = [mk("f_002.png"), mk("f_001.png"), mk("f_010.png")];
    expect(names(frameSort(input))).toEqual(["f_001.png", "f_002.png", "f_010.png"]);
  });
  it("does not mutate the input array", () => {
    const input = [mk("b.png"), mk("a.png")];
    frameSort(input);
    expect(names(input)).toEqual(["b.png", "a.png"]);
  });
});
