"use client";

import { useCallback, useRef, useState } from "react";

export function SplitPane({
  left,
  right,
  min = 25,
  max = 75,
  initial = 50,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  min?: number;
  max?: number;
  initial?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(initial);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    document.body.style.userSelect = "none";
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((event.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(max, Math.max(min, pct)));
    },
    [min, max],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    setDragging(false);
    document.body.style.userSelect = "";
  }, []);

  return (
    <div ref={containerRef} className="flex h-full min-h-0">
      <div className="h-full min-w-0 overflow-hidden" style={{ width: `${leftPct}%` }}>
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`relative w-px shrink-0 cursor-col-resize touch-none before:absolute before:inset-y-0 before:-left-1 before:-right-1 before:content-[''] ${
          dragging ? "bg-primary" : "bg-border hover:bg-primary/50"
        }`}
      />
      <div className="h-full min-w-0 flex-1 overflow-hidden">{right}</div>
    </div>
  );
}
