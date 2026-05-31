import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dropzone } from "./Dropzone";

const mkPng = (name: string) => new File([new Uint8Array([0x89, 0x50])], name, { type: "image/png" });

describe("Dropzone", () => {
  it("emits accepted PNGs in natural order via onFiles", async () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} onReject={() => {}} />);
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    await userEvent.upload(input, [mkPng("frame_2.png"), mkPng("frame_1.png")]);
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0][0].map((f: File) => f.name)).toEqual(["frame_1.png", "frame_2.png"]);
  });

  it("reports rejected non-PNG names via onReject on drop", () => {
    const onReject = vi.fn();
    render(<Dropzone onFiles={() => {}} onReject={onReject} />);
    const jpg = new File([new Uint8Array()], "bad.jpg", { type: "image/jpeg" });
    fireEvent.drop(screen.getByText(/drop your png/i), { dataTransfer: { files: [jpg] } });
    expect(onReject).toHaveBeenCalledWith(["bad.jpg"]);
  });
});
