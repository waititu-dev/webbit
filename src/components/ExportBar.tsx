import { useState } from "react";
import type { Settings } from "../types";
import { useFfmpeg } from "../hooks/useFfmpeg";
import { downloadBlob } from "../lib/download";

interface Props {
  files: File[];
  settings: Settings;
}

export function ExportBar({ files, settings }: Props) {
  const { encodeWebm, progress, status } = useFfmpeg();
  const [error, setError] = useState<string | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const busy = status === "loading" || status === "encoding";
  const disabled = files.length === 0 || busy;

  async function run() {
    setError(null);
    try {
      const blob = await encodeWebm(files, settings, audio);
      downloadBlob(blob, "webbit.webm");
    } catch {
      setError("Encoding failed. Please try again.");
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-zinc-700">
          Soundtrack <span className="text-zinc-400">— optional</span>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
            className="mt-1 block text-sm text-zinc-500 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-zinc-700 hover:file:bg-zinc-200"
          />
        </label>
        {audio && (
          <button type="button" onClick={() => setAudio(null)} className="mt-1 block text-xs text-zinc-400 underline">
            Remove {audio.name}
          </button>
        )}
      </div>

      <button
        onClick={run}
        disabled={disabled}
        className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
      >
        Download WebM
      </button>

      {busy && (
        <div className="space-y-1">
          <p className="text-sm text-zinc-500">{status === "loading" ? "Loading encoder…" : "Encoding…"}</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
