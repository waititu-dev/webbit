import { useRef, useState, type DragEvent } from "react";
import { frameSort } from "../lib/frameSort";
import { validateFiles } from "../lib/validateFiles";

interface Props {
  onFiles: (files: File[]) => void;
  onReject: (names: string[]) => void;
}

export function Dropzone({ onFiles, onReject }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  function handle(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const { accepted, rejected } = validateFiles(Array.from(fileList));
    if (rejected.length) onReject(rejected);
    if (accepted.length) onFiles(frameSort(accepted));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setHover(false);
    handle(e.dataTransfer.files);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
      className={`flex h-56 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed text-center transition
        ${hover ? "border-indigo-400 bg-indigo-50" : "border-zinc-300 bg-zinc-50 hover:border-zinc-400"}`}
    >
      <div className="text-zinc-500">
        <p className="text-lg font-medium">Drop your PNG frames here</p>
        <p className="text-sm">or click to choose files</p>
      </div>
      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  );
}
