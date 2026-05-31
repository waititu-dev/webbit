import { useState } from "react";
import type { Settings } from "../types";
import { useFfmpeg } from "../hooks/useFfmpeg";
import { downloadBlob } from "../lib/download";

interface Props {
  files: File[];
  settings: Settings;
}

export function ExportBar({ files, settings }: Props) {
  const { encodeWebp, encodeGif, progress, status } = useFfmpeg();
  const [error, setError] = useState<string | null>(null);
  const busy = status === "loading" || status === "encoding";
  const disabled = files.length === 0 || busy;

  async function run(kind: "webp" | "gif") {
    setError(null);
    try {
      const blob = kind === "webp" ? await encodeWebp(files, settings) : await encodeGif(files, settings);
      downloadBlob(blob, `webbit.${kind}`);
    } catch {
      setError("Encoding failed. Please try again.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          onClick={() => run("webp")}
          disabled={disabled}
          className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
        >
          Download WebP
        </button>
        <button
          onClick={() => run("gif")}
          disabled={disabled}
          className="rounded-lg border border-zinc-300 px-5 py-2 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
        >
          Download GIF
        </button>
      </div>
      {busy && (
        <div className="space-y-1">
          <p className="text-sm text-zinc-500">
            {status === "loading" ? "Loading encoder…" : "Encoding…"}
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
