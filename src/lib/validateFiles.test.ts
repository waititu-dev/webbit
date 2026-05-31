import { describe, it, expect } from "vitest";
import { validateFiles } from "./validateFiles";

const mk = (name: string, type: string) => new File([new Uint8Array()], name, { type });

describe("validateFiles", () => {
  it("keeps PNGs and reports rejected names", () => {
    const input = [mk("a.png", "image/png"), mk("b.jpg", "image/jpeg"), mk("c.PNG", "image/png")];
    const { accepted, rejected } = validateFiles(input);
    expect(accepted.map((f) => f.name)).toEqual(["a.png", "c.PNG"]);
    expect(rejected).toEqual(["b.jpg"]);
  });
  it("falls back to extension when MIME type is empty", () => {
    const input = [mk("x.png", "")];
    expect(validateFiles(input).accepted.map((f) => f.name)).toEqual(["x.png"]);
  });
});
