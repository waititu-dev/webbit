import { useCallback, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { Settings } from "../types";
import { clampFps } from "../lib/timing";

const pad = (n: number) => String(n).padStart(4, "0");
const AUDIO_IN = "audio_in";
const isLeftover = (name: string) =>
  /^in_\d+\.png$/.test(name) || name === "out.webm" || name.startsWith(`${AUDIO_IN}.`);

export type EncodeStatus = "idle" | "loading" | "encoding" | "error";

// 0–100 Quality slider → VP8/VP9 CRF (lower = better quality).
const qualityToCrf = (quality: number) =>
  Math.round(63 - (Math.min(100, Math.max(0, quality)) / 100) * 53);

export function useFfmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<EncodeStatus>("idle");

  const ensureLoaded = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    setStatus("loading");
    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress }) => setProgress(Math.min(1, Math.max(0, progress))));
    // ffmpeg-core.wasm is ~32 MB, over Cloudflare's 25 MiB static-asset limit, so load from a CDN.
    // ESM build (not UMD): Vite bundles ffmpeg's worker as a module worker, where only the ESM
    // core's `export default` resolves under dynamic import — UMD fails with "failed to import".
    const base = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  }, []);

  // Wipe leftover inputs/outputs so a previous (longer) sequence isn't silently reused.
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

  const encodeWebm = useCallback(
    async (files: File[], s: Settings, audio?: File | null): Promise<Blob> => {
      try {
        const ffmpeg = await ensureLoaded();
        setStatus("encoding");
        setProgress(0);
        await resetFs(ffmpeg);
        await writeFrames(ffmpeg, files);

        const fps = String(clampFps(s.fps));
        const crf = String(qualityToCrf(s.quality));
        const vcodec = s.codec === "vp8" ? "libvpx" : "libvpx-vp9";

        const args = ["-framerate", fps, "-i", "in_%04d.png"];
        if (audio) {
          const ext = audio.name.includes(".") ? audio.name.split(".").pop()! : "bin";
          const audioName = `${AUDIO_IN}.${ext}`;
          await ffmpeg.writeFile(audioName, await fetchFile(audio));
          args.push("-i", audioName);
        }
        // -b:v 0 puts libvpx in constant-quality (CRF) mode. yuva420p keeps the alpha channel
        // so transparent PNG sequences stay transparent.
        // -auto-alt-ref 0: libvpx defaults alt-ref frames on for VP9, but alt-ref frames can't
        // carry alpha, so VP9 aborts with "Transparency encoding with auto_alt_ref does not
        // work" unless we disable them. VP8's libvpx in this wasm core can't mux alpha
        // (yuva420p aborts the core during finalization), so VP8 flattens to yuv420p.
        args.push("-c:v", vcodec, "-crf", crf, "-b:v", "0");
        if (s.codec === "vp8") {
          args.push("-pix_fmt", "yuv420p");
        } else {
          args.push("-auto-alt-ref", "0", "-pix_fmt", "yuva420p");
        }
        if (audio) args.push("-c:a", "libopus", "-shortest");
        args.push("out.webm");

        await ffmpeg.exec(args);
        const data = await ffmpeg.readFile("out.webm");
        setStatus("idle");
        return new Blob([data as BlobPart], { type: "video/webm" });
      } catch (e) {
        console.error("[webbit] encode failed:", e);
        setStatus("error");
        throw e;
      }
    },
    [ensureLoaded, resetFs, writeFrames],
  );

  return { encodeWebm, progress, status };
}
