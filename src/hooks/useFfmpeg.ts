import { useCallback, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { Settings } from "../types";
import { clampFps } from "../lib/timing";

const pad = (n: number) => String(n).padStart(4, "0");
const isLeftover = (name: string) =>
  /^in_\d+\.png$/.test(name) || name === "palette.png" || name === "out.webp" || name === "out.gif";

export type EncodeStatus = "idle" | "loading" | "encoding" | "error";

export function useFfmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<EncodeStatus>("idle");

  const ensureLoaded = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    setStatus("loading");
    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress }) => setProgress(Math.min(1, Math.max(0, progress))));
    const base = `${import.meta.env.BASE_URL}ffmpeg`;
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  }, []);

  // Each encode reads in_%04d.png contiguously, so leftover frames from a
  // previous (longer) sequence would be silently included. Wipe them first.
  const resetFs = useCallback(async (ffmpeg: FFmpeg) => {
    const entries = await ffmpeg.listDir("/");
    await Promise.all(
      entries
        .filter((e) => !e.isDir && isLeftover(e.name))
        .map((e) => ffmpeg.deleteFile(e.name).catch(() => {})),
    );
  }, []);

  const writeFrames = useCallback(async (ffmpeg: FFmpeg, files: File[]) => {
    for (let i = 0; i < files.length; i++) {
      await ffmpeg.writeFile(`in_${pad(i)}.png`, await fetchFile(files[i]));
    }
  }, []);

  const encodeWebp = useCallback(
    async (files: File[], s: Settings): Promise<Blob> => {
      try {
        const ffmpeg = await ensureLoaded();
        setStatus("encoding");
        setProgress(0);
        await resetFs(ffmpeg);
        await writeFrames(ffmpeg, files);
        const fps = String(clampFps(s.fps));
        const quality = s.lossless
          ? ["-lossless", "1"]
          : ["-lossless", "0", "-q:v", String(s.quality)];
        await ffmpeg.exec([
          "-framerate", fps, "-i", "in_%04d.png",
          "-c:v", "libwebp", "-loop", "0",
          ...quality,
          "out.webp",
        ]);
        const data = await ffmpeg.readFile("out.webp");
        setStatus("idle");
        return new Blob([data as BlobPart], { type: "image/webp" });
      } catch (e) {
        setStatus("error");
        throw e;
      }
    },
    [ensureLoaded, resetFs, writeFrames],
  );

  const encodeGif = useCallback(
    async (files: File[], s: Settings): Promise<Blob> => {
      try {
        const ffmpeg = await ensureLoaded();
        setStatus("encoding");
        setProgress(0);
        await resetFs(ffmpeg);
        await writeFrames(ffmpeg, files);
        const fps = String(clampFps(s.fps));
        await ffmpeg.exec(["-i", "in_%04d.png", "-vf", `fps=${fps},palettegen`, "palette.png"]);
        await ffmpeg.exec([
          "-framerate", fps, "-i", "in_%04d.png", "-i", "palette.png",
          "-lavfi", `fps=${fps}[x];[x][1:v]paletteuse`, "-loop", "0", "out.gif",
        ]);
        const data = await ffmpeg.readFile("out.gif");
        setStatus("idle");
        return new Blob([data as BlobPart], { type: "image/gif" });
      } catch (e) {
        setStatus("error");
        throw e;
      }
    },
    [ensureLoaded, resetFs, writeFrames],
  );

  return { encodeWebp, encodeGif, progress, status };
}
