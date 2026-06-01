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

const MAX_CRF = 63; // libvpx CRF ceiling = worst quality
const MIN_CRF = 10; // best quality we expose
// 0–100 Quality slider → VP8/VP9 CRF (lower = better quality).
const qualityToCrf = (quality: number) =>
  Math.round(MAX_CRF - (Math.min(100, Math.max(0, quality)) / 100) * (MAX_CRF - MIN_CRF));

export function useFfmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const logRef = useRef<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<EncodeStatus>("idle");

  const ensureLoaded = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    setStatus("loading");
    const ffmpeg = new FFmpeg();
    // Keep the tail of ffmpeg's stderr; exec() doesn't surface the reason a failed encode died.
    ffmpeg.on("log", ({ message }) => {
      logRef.current.push(message);
      if (logRef.current.length > 40) logRef.current.shift();
    });
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
        logRef.current = [];
        await resetFs(ffmpeg);
        await writeFrames(ffmpeg, files);

        const fps = String(clampFps(s.fps));
        const crf = String(qualityToCrf(s.quality));
        const vcodec = s.codec === "vp8" ? "libvpx" : "libvpx-vp9";

        const args = ["-framerate", fps, "-i", "in_%04d.png"];
        if (audio) {
          const ext = audio.name.split(".").pop() || "bin";
          const audioName = `${AUDIO_IN}.${ext}`;
          await ffmpeg.writeFile(audioName, await fetchFile(audio));
          args.push("-i", audioName);
        }
        // -b:v 0 puts libvpx in constant-quality (CRF) mode.
        // VP8 (the default) reliably encodes long sequences but can't mux alpha in this wasm core
        // (yuva420p aborts during finalization), so it flattens to yuv420p.
        // VP9 keeps alpha (yuva420p) for transparent renders, but libvpx-vp9 in this core traps
        // (wasm "memory access out of bounds") once a sequence exceeds ~16 frames — so VP9 is only
        // usable for short clips. -auto-alt-ref 0 is required because alt-ref frames can't carry
        // alpha (VP9 otherwise aborts with "Transparency encoding with auto_alt_ref does not work").
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
        console.error("[webbit] encode failed:", e, logRef.current.join("\n"));
        // A VP9 wasm trap leaves the worker corrupted; drop it so the next encode reloads a fresh core.
        try {
          ffmpegRef.current?.terminate();
        } catch {
          /* already gone */
        }
        ffmpegRef.current = null;
        setStatus("error");
        throw new Error(
          s.codec === "vp9"
            ? "Transparent (VP9) export failed — in-browser VP9 can't handle sequences beyond ~16 frames. Switch the Encoder to VP8 for longer clips (VP8 drops transparency)."
            : "Encoding failed. Please try again.",
        );
      }
    },
    [ensureLoaded, resetFs, writeFrames],
  );

  return { encodeWebm, progress, status };
}
