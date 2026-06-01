export interface Frame {
  file: File;
  url: string;
}

export type Codec = "vp9" | "vp8";

export interface Settings {
  fps: number;
  quality: number;
  codec: Codec;
}

// VP8 is the default: it reliably encodes long sequences. VP9 (transparency) is opt-in because
// libvpx-vp9 in the wasm core traps beyond ~16 frames. See useFfmpeg.
export const DEFAULT_SETTINGS: Settings = { fps: 24, quality: 80, codec: "vp8" };
