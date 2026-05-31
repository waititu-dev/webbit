import { useEffect, useMemo, useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { FrameList } from "./components/FrameList";
import { Preview } from "./components/Preview";
import { Controls } from "./components/Controls";
import { ExportBar } from "./components/ExportBar";
import { DEFAULT_SETTINGS, type Frame, type Settings } from "./types";

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [rejected, setRejected] = useState<string[]>([]);

  const frames = useMemo<Frame[]>(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => () => frames.forEach((f) => URL.revokeObjectURL(f.url)), [frames]);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Webbit</h1>
        <p className="text-zinc-500">Turn a PNG sequence into a WebM video — right in your browser.</p>
      </header>

      <Dropzone onFiles={setFiles} onReject={setRejected} />
      {rejected.length > 0 && (
        <p className="text-sm text-amber-600">Skipped {rejected.length} non-PNG file(s): {rejected.join(", ")}</p>
      )}

      {frames.length > 0 && (
        <section className="space-y-6">
          <FrameList frames={frames} />
          <Preview frames={frames} fps={settings.fps} />
          <Controls settings={settings} onChange={setSettings} />
          <ExportBar files={files} settings={settings} />
        </section>
      )}
    </main>
  );
}
