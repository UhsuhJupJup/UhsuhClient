"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { formatCount } from "@/lib/format";
import {
  cameraTransform,
  contextLinks,
  nodeBox,
  nodeColor,
  pairKey,
  type Camera,
  type GraphLink,
  type GraphModel,
  type GraphNode,
  type Viewport,
} from "@/components/keyword/keywordGraphModel";

const NODE_RADIUS = 8;
const RING_OFFSET = 5;
const FOCUS_OFFSET = 9;
const ENTER_DURATION_MS = 620;
const ENTER_SETTLE_MS = ENTER_DURATION_MS + 120;
const ENTER_STAGGER = 0.4;
const CAMERA_TRANSITION = "transform 520ms cubic-bezier(0.2, 0.7, 0.2, 1)";
const WHEEL_ZOOM_RATE = 0.0025;
const MAX_EXTRA_THICKNESS = 4;
const THICKNESS_RATE = 0.9;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface Motion {
  starts: ReadonlyMap<number, number>;
  now: number;
  settledBatch: number;
}

interface Shown {
  x: number;
  y: number;
  opacity: number;
}

function subscribeReducedMotion(notify: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

function readReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function readReducedMotionOnServer(): boolean {
  return false;
}

function easeOut(value: number): number {
  return 1 - (1 - value) ** 3;
}

function useEnterClock(batch: number, reducedMotion: boolean): (enteredBatch: number) => number {
  const [motion, setMotion] = useState<Motion>({ starts: new Map(), now: 0, settledBatch: batch });

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    let startedAt: number | null = null;
    const step = (now: number) => {
      const first = startedAt === null;
      startedAt ??= now;
      setMotion((previous) => {
        if (!first) return { ...previous, now };
        const running = [...previous.starts].filter(([, at]) => now - at < ENTER_DURATION_MS);
        return { ...previous, starts: new Map(running).set(batch, now), now };
      });
      if (now - startedAt < ENTER_DURATION_MS) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    const settle = window.setTimeout(() => {
      cancelAnimationFrame(frame);
      setMotion({ starts: new Map(), now: 0, settledBatch: batch });
    }, ENTER_SETTLE_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [batch, reducedMotion]);

  return (enteredBatch: number) => {
    if (reducedMotion || enteredBatch <= motion.settledBatch) return 1;
    const startedAt = motion.starts.get(enteredBatch);
    if (startedAt === undefined) return enteredBatch === batch ? 0 : 1;
    return Math.min(1, (motion.now - startedAt) / ENTER_DURATION_MS);
  };
}

function showNode(node: GraphNode, progressOf: (enteredBatch: number) => number): Shown {
  const progress = node.enteredBatch < 0 ? 1 : progressOf(node.enteredBatch);
  if (progress >= 1) {
    return { x: node.x, y: node.y, opacity: 1 };
  }
  const delay = node.enterTotal > 1 ? (node.enterOrder / (node.enterTotal - 1)) * ENTER_STAGGER : 0;
  const local = Math.min(1, Math.max(0, (progress - delay) / (1 - ENTER_STAGGER)));
  const eased = easeOut(local);
  return {
    x: node.originX + (node.x - node.originX) * eased,
    y: node.originY + (node.y - node.originY) * eased,
    opacity: Math.min(1, local * 2),
  };
}

export function KeywordGraphView({
  model,
  camera,
  viewport,
  selectedId,
  loadingIds,
  onPick,
  onReveal,
  onResize,
  onPan,
  onZoom,
}: {
  model: GraphModel;
  camera: Camera;
  viewport: Viewport;
  selectedId: number;
  loadingIds: ReadonlySet<number>;
  onPick: (id: number, name: string) => void;
  onReveal: (id: number) => void;
  onResize: (viewport: Viewport) => void;
  onPan: (dx: number, dy: number) => void;
  onZoom: (factor: number, anchorX: number, anchorY: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cameraArmed, setCameraArmed] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    readReducedMotionOnServer,
  );
  const progressOf = useEnterClock(model.batch, reducedMotion);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      onResize({ width: entry.contentRect.width, height: entry.contentRect.height });
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setCameraArmed(true));
    });
    observer.observe(svg);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [onResize]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      onZoom(
        Math.exp(-event.deltaY * WHEEL_ZOOM_RATE),
        event.clientX - rect.left,
        event.clientY - rect.top,
      );
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [onZoom]);

  const startDrag = (event: ReactPointerEvent<SVGRectElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    setDragging(true);
  };

  const moveDrag = (event: ReactPointerEvent<SVGRectElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    onPan(event.clientX - drag.x, event.clientY - drag.y);
    dragRef.current = { pointerId: drag.pointerId, x: event.clientX, y: event.clientY };
  };

  const endDrag = (event: ReactPointerEvent<SVGRectElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  const nodes = [...model.nodes.values()];
  const shown = new Map(nodes.map((node) => [node.id, showNode(node, progressOf)]));
  const directLinks = [...model.links.values()];
  const dashedLinks = contextLinks(model, selectedId);
  const selectedName = model.nodes.get(selectedId)?.name ?? "";

  const line = (link: GraphLink, dashed: boolean) => {
    const a = model.nodes.get(link.a);
    const b = model.nodes.get(link.b);
    const from = shown.get(link.a);
    const to = shown.get(link.b);
    if (!a || !b || !from || !to) return null;
    const thickness = 1 + Math.min(MAX_EXTRA_THICKNESS, Math.log2(1 + link.weight) * THICKNESS_RATE);
    const visibility = Math.min(from.opacity, to.opacity) * (dashed ? 0.45 : 0.55);
    return (
      <line
        key={`${dashed ? "context" : "direct"}:${pairKey(link.a, link.b)}`}
        x1={from.x.toFixed(1)}
        y1={from.y.toFixed(1)}
        x2={to.x.toFixed(1)}
        y2={to.y.toFixed(1)}
        strokeWidth={thickness.toFixed(1)}
        strokeLinecap="round"
        strokeDasharray={dashed ? "2 5" : undefined}
        opacity={visibility.toFixed(2)}
        className="stroke-muted"
      >
        <title>
          {dashed
            ? `${a.name}, ${b.name}: ${selectedName} 글 안에서 함께 붙은 글 ${formatCount(link.weight)}개`
            : `${a.name}, ${b.name}: 함께 붙은 글 ${formatCount(link.weight)}개`}
        </title>
      </line>
    );
  };

  return (
    <svg
      ref={svgRef}
      role="group"
      aria-label="키워드 그래프"
      className="block h-[clamp(380px,62vw,600px)] w-full touch-pan-y touch-pinch-zoom select-none"
    >
      <rect
        width="100%"
        height="100%"
        fill="transparent"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={dragging ? "cursor-grabbing" : "cursor-grab"}
      />
      <g
        style={{
          transform: cameraTransform(camera, viewport),
          transformOrigin: "0 0",
          transition: dragging || reducedMotion || !cameraArmed ? "none" : CAMERA_TRANSITION,
        }}
      >
        {dashedLinks.map((link) => line(link, true))}
        {directLinks.map((link) => line(link, false))}
        {nodes.map((node) => {
          const place = shown.get(node.id);
          if (!place) return null;
          const box = nodeBox(node, model.scaleWeight);
          const color = nodeColor(node.name);
          const x = place.x - box.width / 2;
          const y = place.y - box.height / 2;
          const selected = node.id === selectedId;
          const loading = loadingIds.has(node.id);
          const countLabel = `${node.expanded ? "글" : "함께 붙은 글"} ${formatCount(node.weight)}개`;
          const frame = (offset: number) => ({
            x: (x - offset).toFixed(1),
            y: (y - offset).toFixed(1),
            width: (box.width + offset * 2).toFixed(1),
            height: box.height + offset * 2,
            rx: NODE_RADIUS + offset - 1,
          });
          const pick = () => onPick(node.id, node.name);
          const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            pick();
          };
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              aria-label={`${node.name}, ${countLabel}, ${node.expanded ? "요약 보기" : "펼치기"}`}
              aria-current={selected ? "true" : undefined}
              aria-busy={loading || undefined}
              data-keyword-id={node.id}
              data-expanded={node.expanded}
              onClick={pick}
              onKeyDown={onKeyDown}
              onFocus={(event) => {
                if (event.currentTarget.matches(":focus-visible")) onReveal(node.id);
              }}
              opacity={place.opacity.toFixed(2)}
              className={`group cursor-pointer outline-none ${loading ? "motion-safe:animate-pulse" : ""}`}
            >
              <rect
                {...frame(FOCUS_OFFSET)}
                fill="none"
                strokeWidth={3}
                className="stroke-primary opacity-0 group-focus-visible:opacity-100"
              />
              {selected && (
                <rect {...frame(RING_OFFSET)} fill="none" strokeWidth={2.5} className="stroke-fg" />
              )}
              <rect
                x={x.toFixed(1)}
                y={y.toFixed(1)}
                width={box.width.toFixed(1)}
                height={box.height}
                rx={NODE_RADIUS}
                fill={node.expanded ? color : "var(--card)"}
                stroke={color}
                strokeWidth={1.6}
                className="group-hover:brightness-95"
              />
              {!node.expanded && (
                <rect
                  x={x.toFixed(1)}
                  y={y.toFixed(1)}
                  width={box.width.toFixed(1)}
                  height={box.height}
                  rx={NODE_RADIUS}
                  fill={color}
                  opacity={0.14}
                />
              )}
              <text
                x={place.x.toFixed(1)}
                y={(place.y + box.font * 0.36).toFixed(1)}
                textAnchor="middle"
                fontSize={box.font}
                className={`pointer-events-none font-mono font-semibold ${
                  node.expanded ? "fill-primary-fg" : "fill-fg"
                }`}
              >
                {node.name}
              </text>
              <title>{`${node.name}: ${countLabel}`}</title>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
