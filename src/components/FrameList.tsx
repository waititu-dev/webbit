import type { Frame } from "../types";

interface Props {
  frames: Frame[];
}

export function FrameList({ frames }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {frames.map((frame, i) => (
        <div key={frame.url} className="relative">
          <img
            src={frame.url}
            alt={`frame ${i + 1}`}
            className="h-16 w-16 rounded-md object-cover ring-1 ring-zinc-200"
          />
          <span className="absolute bottom-0 right-0 rounded-tl bg-black/60 px-1 text-[10px] text-white">
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
