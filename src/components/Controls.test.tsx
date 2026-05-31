import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Controls } from "./Controls";
import { DEFAULT_SETTINGS } from "../types";

describe("Controls", () => {
  it("emits fps changes", async () => {
    const onChange = vi.fn();
    render(<Controls settings={DEFAULT_SETTINGS} onChange={onChange} />);
    const fps = screen.getByLabelText(/frame rate/i);
    await userEvent.clear(fps);
    await userEvent.type(fps, "30");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ fps: 30 }));
  });

  it("emits codec changes", async () => {
    const onChange = vi.fn();
    render(<Controls settings={DEFAULT_SETTINGS} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /VP8/i }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ codec: "vp8" }));
  });
});
