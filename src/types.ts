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

export const DEFAULT_SETTINGS: Settings = { fps: 24, quality: 80, codec: "vp9" };
