import { useState, useEffect } from "react";
import type { Settings } from "../types";

interface Props {
  settings: Settings;
  onChange: (next: Settings) => void;
}

export function Controls({ settings, onChange }: Props) {
  const [fpsInput, setFpsInput] = useState(String(settings.fps));

  useEffect(() => {
    setFpsInput(String(settings.fps));
  }, [settings.fps]);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        Frame rate
        <input
          type="number"
          min={1}
          max={60}
          value={fpsInput}
          onChange={(e) => {
            setFpsInput(e.target.value);
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange({ ...settings, fps: n });
          }}
          className="w-20 rounded-md border border-zinc-300 px-2 py-1"
        />
        <span className="text-zinc-400">fps</span>
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        Quality
        <input
          type="range"
          min={0}
          max={100}
          value={settings.quality}
          disabled={settings.lossless}
          onChange={(e) => onChange({ ...settings, quality: Number(e.target.value) })}
          className="accent-indigo-500 disabled:opacity-40"
        />
        <span className="w-8 text-zinc-400">{settings.quality}</span>
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        <input
          type="checkbox"
          checked={settings.lossless}
          onChange={(e) => onChange({ ...settings, lossless: e.target.checked })}
          className="accent-indigo-500"
        />
        Lossless
      </label>
    </div>
  );
}
