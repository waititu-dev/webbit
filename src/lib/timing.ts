export function clampFps(fps: number): number {
  if (Number.isNaN(fps)) return 24;
  return Math.min(60, Math.max(1, Math.round(fps)));
}

export function fpsToFrameMs(fps: number): number {
  return 1000 / clampFps(fps);
}
