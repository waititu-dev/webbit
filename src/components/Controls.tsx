import { useState, useEffect } from "react";
import type { Settings, Codec } from "../types";

interface Props {
  settings: Settings;
  onChange: (next: Settings) => void;
}

const CODECS: { value: Codec; label: string; hint: string }[] = [
  { value: "vp9", label: "VP9", hint: "best quality" },
  { value: "vp8", label: "VP8", hint: "faster" },
];

export function Controls({ settings, onChange }: Props) {
  const [fpsInput, setFpsInput] = useState(String(settings.fps));

  useEffect(() => {
    setFpsInput(String(settings.fps));
  }, [settings.fps]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700">Encoder</span>
          <div className="inline-flex overflow-hidden rounded-lg border border-zinc-300" role="group" aria-label="Encoder">
            {CODECS.map((c) => {
              const active = settings.codec === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ ...settings, codec: c.value })}
                  className={
                    "px-4 py-1.5 text-sm " +
                    (active ? "bg-indigo-600 font-semibold text-white" : "bg-white text-zinc-600 hover:bg-zinc-50")
                  }
                >
                  {c.label} <span className="text-xs opacity-80">· {c.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

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
      </div>

      <label className="block text-sm font-medium text-zinc-700">
        Quality
        <input
          type="range"
          min={0}
          max={100}
          value={settings.quality}
          onChange={(e) => onChange({ ...settings, quality: Number(e.target.value) })}
          className="mt-2 block w-full accent-indigo-500"
        />
        <span className="flex justify-between text-xs font-normal text-zinc-400">
          <span>Smaller file</span>
          <span>Best quality</span>
        </span>
      </label>
    </div>
  );
}
