import { useLayoutEffect, useRef, useState } from "react";
import type { Frame } from "../types";

interface Props {
  frames: Frame[];
}

export function FrameList({ frames }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  // A new sequence always starts collapsed.
  useLayoutEffect(() => {
    setExpanded(false);
  }, [frames]);

  // Only offer the toggle when the collapsed strip actually hides rows.
  useLayoutEffect(() => {
    if (expanded) return;
    const el = stripRef.current;
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [frames, expanded]);

  const collapsed = overflowing && !expanded;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-600">
        {frames.length} {frames.length === 1 ? "frame" : "frames"}
      </p>

      <div className="relative">
        <div
          ref={stripRef}
          className={`flex flex-wrap gap-2 ${expanded ? "" : "max-h-52 overflow-hidden"}`}
        >
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
        {collapsed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {(overflowing || expanded) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          {expanded ? "Show fewer" : "See more"}
        </button>
      )}
    </div>
  );
}
