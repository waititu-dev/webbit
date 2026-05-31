export interface Frame {
  file: File;
  url: string;
}

export interface Settings {
  fps: number;
  quality: number;
  lossless: boolean;
}

export const DEFAULT_SETTINGS: Settings = { fps: 24, quality: 80, lossless: false };
