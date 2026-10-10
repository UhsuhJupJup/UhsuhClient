"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GraphEdge, GraphNode } from "@/lib/types";

interface SimNode {
  id: string;
  type: GraphNode["type"];
  label: string;
  inNote: boolean;
  rank: number | null;
  weight: number | null;
  text: string;
  font: number;
  emphasis: number;
  color: string;
  hw: number;
  hh: number;
  x: number;
  y: number;
}

interface SimEdge {
  a: SimNode;
  b: SimNode;
}

interface Tip {
  x: number;
  y: number;
  title: string;
  meta: string;
}

const GAP = 6;
const SPIRAL_GROWTH = 4;
const SPIRAL_STEP = 10;
const TYPE_ORDER: Record<GraphNode["type"], number> = { note: 0, article: 1, keyword: 2 };
const PALETTE = [
  "#1f6f4a",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#b45309",
  "#0d9488",
  "#dc2626",
  "#4f46e5",
  "#0284c7",
];
const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function paletteColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

function withAlpha(color: string, alpha: number): string {
  const value = color.trim();
  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((ch) => ch + ch)
        .join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (match) {
    const [r, g, b] = match[1].split(",").map((part) => part.trim());
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return value;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function idPart(id: string): string {
  return id.slice(id.indexOf(":") + 1);
}

export function KnowledgeGraph({
  nodes,
  edges,
  heightClassName = "h-[480px] sm:h-[580px]",
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  heightClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [tip, setTip] = useState<Tip | null>(null);
  const apiRef = useRef<{ zoomIn: () => void; zoomOut: () => void; reset: () => void } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const context2d = canvas.getContext("2d");
    if (!context2d) return;
    const ctx = context2d;

    function readColors(el: HTMLElement) {
      const cs = getComputedStyle(el);
      const get = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
      return {
        accent: get("--accent", "#d7f051"),
        primary: get("--primary", "#1f6f4a"),
        primaryFg: get("--primary-fg", "#ffffff"),
        accentInk: get("--accent-ink", "#2c3a12"),
        acorn: get("--acorn", "#7c5a3a"),
        muted: get("--muted", "#5c6b62"),
        fg: get("--fg", "#15201a"),
      };
    }

    const degree = new Map<string, number>();
    for (const edge of edges) {
      degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    }
    const weights = nodes
      .filter((node) => node.type === "keyword" && node.weight != null)
      .map((node) => node.weight as number);
    const maxWeight = weights.length ? Math.max(...weights) : 0;

    const simNodes: SimNode[] = nodes.map((node) => {
      const deg = degree.get(node.id) ?? 0;
      let font: number;
      let emphasis = 0;
      if (node.type === "note") {
        font = 14;
      } else if (node.type === "article") {
        font = 11;
      } else {
        if (maxWeight > 0 && node.weight != null) {
          emphasis = Math.sqrt(Math.max(0, node.weight) / maxWeight);
          font = 13 + 17 * emphasis;
        } else {
          font = 11 + Math.min(4, deg * 0.5);
        }
        if (node.inNote === true) font += 1;
      }
      return {
        id: node.id,
        type: node.type,
        label: node.label,
        inNote: node.inNote === true,
        rank: node.rank,
        weight: node.weight,
        text:
          node.type === "article"
            ? String(node.rank ?? "")
            : truncate(node.label, node.type === "note" ? 16 : 24),
        font,
        emphasis,
        color: paletteColor(node.label),
        hw: 14,
        hh: 14,
        x: 0,
        y: 0,
      };
    });

    const byId = new Map(simNodes.map((node) => [node.id, node]));
    const simEdges: SimEdge[] = [];
    for (const edge of edges) {
      const a = byId.get(edge.source);
      const b = byId.get(edge.target);
      if (!a || !b) continue;
      simEdges.push({ a, b });
    }

    let colors = readColors(container);
    let width = 0;
    let height = 0;
    let dpr = 1;
    let initialized = false;
    const view = { scale: 1, offsetX: 0, offsetY: 0 };
    let hover: SimNode | null = null;
    let panning = false;
    let panStartX = 0;
    let panStartY = 0;
    let panOrigX = 0;
    let panOrigY = 0;
    let pressNode: SimNode | null = null;
    let pressX = 0;
    let pressY = 0;
    let moved = false;
    let frame = 0;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinching = false;
    let pinchDist = 0;
    let pinchX = 0;
    let pinchY = 0;

    function nodeFont(node: SimNode): string {
      if (node.type === "article") return `700 ${node.font}px "JetBrains Mono", ui-monospace, monospace`;
      return `${node.type === "note" ? 700 : 600} ${node.font}px "Pretendard", sans-serif`;
    }

    function measureNodes() {
      for (const node of simNodes) {
        if (node.type === "article") {
          node.hw = 14;
          node.hh = 14;
          continue;
        }
        ctx.font = nodeFont(node);
        node.hw = ctx.measureText(node.text).width / 2 + node.font * (0.6 + 0.6 * node.emphasis);
        node.hh = node.font * (0.8 + 0.5 * node.emphasis);
      }
    }

    function aspect(): number {
      return height > 0 ? clamp(width / height, 1, 2.4) : 1;
    }

    function layout() {
      const order = [...simNodes].sort(
        (a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || b.hw * b.hh - a.hw * a.hh,
      );
      const stretch = aspect();
      const placed: SimNode[] = [];
      for (const node of order) {
        let theta = 0;
        for (;;) {
          const radius = SPIRAL_GROWTH * theta;
          const x = Math.cos(theta) * radius * stretch;
          const y = Math.sin(theta) * radius;
          const blocked = placed.some(
            (other) =>
              Math.abs(x - other.x) < node.hw + other.hw + GAP &&
              Math.abs(y - other.y) < node.hh + other.hh + GAP,
          );
          if (!blocked) {
            node.x = x;
            node.y = y;
            break;
          }
          theta += SPIRAL_STEP / Math.max(radius, SPIRAL_STEP);
        }
        placed.push(node);
      }
    }

    function fitView() {
      if (simNodes.length === 0 || width === 0 || height === 0) return;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const node of simNodes) {
        if (node.x - node.hw < minX) minX = node.x - node.hw;
        if (node.y - node.hh < minY) minY = node.y - node.hh;
        if (node.x + node.hw > maxX) maxX = node.x + node.hw;
        if (node.y + node.hh > maxY) maxY = node.y + node.hh;
      }
      const pad = 24;
      const spanX = Math.max(1, maxX - minX);
      const spanY = Math.max(1, maxY - minY);
      const scale = clamp(
        Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY),
        MIN_SCALE,
        MAX_SCALE,
      );
      view.scale = scale;
      view.offsetX = width / 2 - ((minX + maxX) / 2) * scale;
      view.offsetY = height / 2 - ((minY + maxY) / 2) * scale;
    }

    function zoomAround(factor: number, sx: number, sy: number) {
      const next = clamp(view.scale * factor, MIN_SCALE, MAX_SCALE);
      const applied = next / view.scale;
      view.offsetX = sx - (sx - view.offsetX) * applied;
      view.offsetY = sy - (sy - view.offsetY) * applied;
      view.scale = next;
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.setTransform(
        dpr * view.scale,
        0,
        0,
        dpr * view.scale,
        dpr * view.offsetX,
        dpr * view.offsetY,
      );
      const focus = hover;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const node of simNodes) drawNode(node, false);
      if (!focus) return;
      const linked: SimNode[] = [];
      ctx.strokeStyle = withAlpha(focus.type === "keyword" ? focus.color : colors.fg, 0.85);
      ctx.lineWidth = 1.8;
      for (const edge of simEdges) {
        if (edge.a !== focus && edge.b !== focus) continue;
        linked.push(edge.a === focus ? edge.b : edge.a);
        ctx.beginPath();
        ctx.moveTo(edge.a.x, edge.a.y);
        ctx.lineTo(edge.b.x, edge.b.y);
        ctx.stroke();
      }
      for (const node of linked) drawNode(node, false);
      drawNode(focus, true);
    }

    function drawNode(node: SimNode, focused: boolean) {
      ctx.fillStyle =
        node.type === "note" ? colors.accent : node.type === "article" ? colors.primary : node.color;
      ctx.beginPath();
      ctx.roundRect(
        node.x - node.hw,
        node.y - node.hh,
        node.hw * 2,
        node.hh * 2,
        Math.min(node.hh, 8 + 8 * node.emphasis),
      );
      ctx.fill();
      if (node.inNote || focused) {
        ctx.strokeStyle = colors.fg;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = node.type === "note" ? colors.accentInk : colors.primaryFg;
      ctx.font = nodeFont(node);
      ctx.fillText(node.text, node.x, node.y + 0.5);
    }

    function requestDraw() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        draw();
      });
    }

    function resize() {
      const nextWidth = container!.clientWidth;
      const nextHeight = container!.clientHeight;
      if (nextWidth === 0 || nextHeight === 0) return;
      width = nextWidth;
      height = nextHeight;
      colors = readColors(container!);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      if (!initialized) {
        measureNodes();
        layout();
        fitView();
        initialized = true;
      }
      requestDraw();
    }

    function pointerPos(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function screenToWorld(sx: number, sy: number) {
      return { x: (sx - view.offsetX) / view.scale, y: (sy - view.offsetY) / view.scale };
    }

    function nodeAtScreen(sx: number, sy: number): SimNode | null {
      const world = screenToWorld(sx, sy);
      const tol = 4 / view.scale;
      for (let i = simNodes.length - 1; i >= 0; i--) {
        const node = simNodes[i];
        if (
          Math.abs(world.x - node.x) <= node.hw + tol &&
          Math.abs(world.y - node.y) <= node.hh + tol
        ) {
          return node;
        }
      }
      return null;
    }

    function pinchMetrics() {
      const pts = Array.from(pointers.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      return { dist: Math.hypot(dx, dy), cx: (pts[0].x + pts[1].x) / 2, cy: (pts[0].y + pts[1].y) / 2 };
    }

    function onPointerDown(event: PointerEvent) {
      requestDraw();
      const p = pointerPos(event);
      pointers.set(event.pointerId, p);
      canvas!.setPointerCapture(event.pointerId);
      if (pointers.size === 2) {
        const m = pinchMetrics();
        pinching = true;
        pinchDist = m.dist;
        pinchX = m.cx;
        pinchY = m.cy;
        panning = false;
        pressNode = null;
        hover = null;
        setTip(null);
        return;
      }
      const node = nodeAtScreen(p.x, p.y);
      hover = node;
      pressX = p.x;
      pressY = p.y;
      moved = false;
      pressNode = node;
      panning = true;
      panStartX = p.x;
      panStartY = p.y;
      panOrigX = view.offsetX;
      panOrigY = view.offsetY;
      canvas!.style.cursor = "grabbing";
      setTip(null);
    }

    function onPointerMove(event: PointerEvent) {
      requestDraw();
      const p = pointerPos(event);
      if (pointers.has(event.pointerId)) pointers.set(event.pointerId, p);
      if (pinching && pointers.size >= 2) {
        const m = pinchMetrics();
        if (pinchDist > 0) zoomAround(m.dist / pinchDist, m.cx, m.cy);
        view.offsetX += m.cx - pinchX;
        view.offsetY += m.cy - pinchY;
        pinchDist = m.dist;
        pinchX = m.cx;
        pinchY = m.cy;
        return;
      }
      if (panning) {
        if (Math.abs(p.x - pressX) > 4 || Math.abs(p.y - pressY) > 4) moved = true;
        view.offsetX = panOrigX + (p.x - panStartX);
        view.offsetY = panOrigY + (p.y - panStartY);
        return;
      }
      const node = nodeAtScreen(p.x, p.y);
      hover = node;
      if (node) {
        setTip({
          x: node.x * view.scale + view.offsetX,
          y: (node.y - node.hh) * view.scale + view.offsetY,
          title: truncate(node.label, 40),
          meta:
            node.type === "note"
              ? "내 노트"
              : node.type === "article"
                ? `추천 ${node.rank ?? "-"}위`
                : node.weight != null
                  ? `글 ${node.weight}개${node.inNote ? " · 노트 키워드" : ""}`
                  : node.inNote
                    ? "노트 키워드"
                    : "관련 키워드",
        });
        canvas!.style.cursor = node.type === "note" ? "grab" : "pointer";
      } else {
        setTip(null);
        canvas!.style.cursor = "grab";
      }
    }

    function endPointer(event: PointerEvent, allowNavigate: boolean) {
      requestDraw();
      pointers.delete(event.pointerId);
      try {
        canvas!.releasePointerCapture(event.pointerId);
      } catch {}
      if (pointers.size < 2) {
        pinching = false;
        pinchDist = 0;
      }
      if (allowNavigate && pressNode && !moved) {
        if (pressNode.type === "article") {
          routerRef.current.push(`/article/${idPart(pressNode.id)}`);
        } else if (pressNode.type === "keyword") {
          routerRef.current.push(`/keyword/${idPart(pressNode.id)}`);
        }
      }
      if (pointers.size === 0) {
        panning = false;
        pressNode = null;
      }
      canvas!.style.cursor = "grab";
    }

    function onPointerUp(event: PointerEvent) {
      endPointer(event, true);
    }

    function onPointerCancel(event: PointerEvent) {
      endPointer(event, false);
    }

    function onPointerLeave() {
      requestDraw();
      if (!panning && !pinching) {
        hover = null;
        setTip(null);
      }
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      const sx = event.clientX - rect.left;
      const sy = event.clientY - rect.top;
      zoomAround(Math.exp(-event.deltaY * 0.0015), sx, sy);
      setTip(null);
      requestDraw();
    }

    apiRef.current = {
      zoomIn: () => {
        zoomAround(1.25, width / 2, height / 2);
        requestDraw();
      },
      zoomOut: () => {
        zoomAround(0.8, width / 2, height / 2);
        requestDraw();
      },
      reset: () => {
        fitView();
        requestDraw();
      },
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    let disposed = false;
    document.fonts?.ready.then(() => {
      if (disposed) return;
      measureNodes();
      layout();
      fitView();
      requestDraw();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      apiRef.current = null;
    };
  }, [nodes, edges]);

  const buttonClass =
    "grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-fg leading-none shadow-sm transition-colors hover:bg-chip-bg";

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClassName} overflow-hidden rounded-2xl border border-border bg-surface`}
    >
      <canvas ref={canvasRef} className="block h-full w-full touch-none" style={{ cursor: "grab" }} />
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <button type="button" aria-label="확대" onClick={() => apiRef.current?.zoomIn()} className={`${buttonClass} text-lg`}>
          +
        </button>
        <button type="button" aria-label="축소" onClick={() => apiRef.current?.zoomOut()} className={`${buttonClass} text-lg`}>
          −
        </button>
        <button type="button" aria-label="뷰 초기화" onClick={() => apiRef.current?.reset()} className={`${buttonClass} text-base`}>
          ↺
        </button>
      </div>
      {tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[120%] rounded-lg border border-border bg-card px-3 py-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]"
          style={{ left: tip.x, top: tip.y }}
        >
          <p className="m-0 max-w-[220px] truncate text-xs font-bold text-fg">{tip.title}</p>
          <p className="m-0 mt-0.5 font-mono text-[11px] text-muted">{tip.meta}</p>
        </div>
      )}
    </div>
  );
}
