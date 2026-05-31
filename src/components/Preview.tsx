import { useEffect, useRef } from "react";
import type { Frame } from "../types";
import { clampFps } from "../lib/timing";

interface Props {
  frames: Frame[];
  fps: number;
}

export function Preview({ frames, fps }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (frames.length === 0) return;
    indexRef.current = 0;
    const intervalMs = 1000 / clampFps(fps);
    const id = window.setInterval(() => {
      indexRef.current = (indexRef.current + 1) % frames.length;
      if (imgRef.current) imgRef.current.src = frames[indexRef.current].url;
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [frames, fps]);

  if (frames.length === 0) return null;

  return (
    <div className="flex items-center justify-center rounded-xl bg-[repeating-conic-gradient(#f4f4f5_0_25%,#fff_0_50%)] bg-[length:24px_24px] p-4">
      <img ref={imgRef} src={frames[0].url} alt="preview" className="max-h-72 object-contain" />
    </div>
  );
}
