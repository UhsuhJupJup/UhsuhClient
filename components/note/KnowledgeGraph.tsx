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
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number;
  fy: number;
}

interface SimEdge {
  a: SimNode;
  b: SimNode;
  kind: "note" | "art" | "kw";
  weight: number | null;
}

interface Tip {
  x: number;
  y: number;
  title: string;
  meta: string;
}

const REP = 9500;
const SPRING = 0.05;
const GRAV = 0.016;
const DAMP = 0.85;
const VMAX = 7;
const MARGIN = 26;

function restLength(kind: SimEdge["kind"]): number {
  if (kind === "note") return 100;
  if (kind === "art") return 92;
  return 130;
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

export function KnowledgeGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [tip, setTip] = useState<Tip | null>(null);

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
    const ranks = nodes
      .filter((node) => node.type === "article" && node.rank != null)
      .map((node) => node.rank as number);
    const maxRank = ranks.length ? Math.max(...ranks) : 1;

    const simNodes: SimNode[] = nodes.map((node) => {
      const deg = degree.get(node.id) ?? 0;
      let r: number;
      if (node.type === "note") {
        r = 16;
      } else if (node.type === "article") {
        const rank = node.rank ?? maxRank;
        r = Math.max(8, Math.min(16, 9 + (maxRank - rank) * 1.4));
      } else {
        const base = 5 + Math.min(7, deg * 0.8);
        r = node.inNote === true ? base + 2 : base;
      }
      return {
        id: node.id,
        type: node.type,
        label: node.label,
        inNote: node.inNote === true,
        rank: node.rank,
        r,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        fx: 0,
        fy: 0,
      };
    });

    const byId = new Map(simNodes.map((node) => [node.id, node]));
    const simEdges: SimEdge[] = [];
    for (const edge of edges) {
      const a = byId.get(edge.source);
      const b = byId.get(edge.target);
      if (!a || !b) continue;
      const kind =
        a.type === "note" || b.type === "note"
          ? "note"
          : a.type === "article" || b.type === "article"
            ? "art"
            : "kw";
      simEdges.push({ a, b, kind, weight: edge.weight });
    }

    let colors = readColors(container);
    let width = 0;
    let height = 0;
    let initialized = false;
    let dragging: SimNode | null = null;
    let pressNode: SimNode | null = null;
    let pressX = 0;
    let pressY = 0;
    let moved = false;
    let frame = 0;

    function layoutInit() {
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.34;
      simNodes.forEach((node, i) => {
        const t = (i / simNodes.length) * Math.PI * 2;
        node.x = cx + Math.cos(t) * radius + (Math.random() - 0.5) * 40;
        node.y = cy + Math.sin(t) * radius + (Math.random() - 0.5) * 40;
        node.vx = 0;
        node.vy = 0;
      });
      const note = simNodes.find((node) => node.type === "note");
      if (note) {
        note.x = cx + (Math.random() - 0.5) * 20;
        note.y = cy + (Math.random() - 0.5) * 20;
      }
    }

    function step() {
      const cx = width / 2;
      const cy = height / 2;
      for (const node of simNodes) {
        node.fx = 0;
        node.fy = 0;
      }
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const a = simNodes[i];
          const b = simNodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) d2 = 1;
          const d = Math.sqrt(d2);
          const f = REP / d2;
          const ux = dx / d;
          const uy = dy / d;
          a.fx += ux * f;
          a.fy += uy * f;
          b.fx -= ux * f;
          b.fy -= uy * f;
        }
      }
      for (const edge of simEdges) {
        const { a, b } = edge;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = SPRING * (d - restLength(edge.kind));
        const ux = dx / d;
        const uy = dy / d;
        a.fx += ux * f;
        a.fy += uy * f;
        b.fx -= ux * f;
        b.fy -= uy * f;
      }
      for (const node of simNodes) {
        node.fx += (cx - node.x) * GRAV;
        node.fy += (cy - node.y) * GRAV;
      }
      for (const node of simNodes) {
        if (node === dragging) continue;
        node.vx = (node.vx + node.fx) * DAMP;
        node.vy = (node.vy + node.fy) * DAMP;
        node.vx = Math.max(-VMAX, Math.min(VMAX, node.vx));
        node.vy = Math.max(-VMAX, Math.min(VMAX, node.vy));
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(MARGIN, Math.min(width - MARGIN, node.x));
        node.y = Math.max(MARGIN, Math.min(height - MARGIN, node.y));
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const edge of simEdges) {
        if (edge.kind === "note") {
          ctx.strokeStyle = withAlpha(colors.accent, 0.55);
          ctx.lineWidth = 1.4;
        } else if (edge.kind === "art") {
          ctx.strokeStyle = withAlpha(colors.primary, 0.28);
          ctx.lineWidth = 1.1;
        } else {
          const hot = edge.a.inNote || edge.b.inNote;
          ctx.strokeStyle = hot ? withAlpha(colors.acorn, 0.4) : withAlpha(colors.muted, 0.16);
          const weight = edge.weight ?? 1;
          ctx.lineWidth = hot ? Math.max(0.8, Math.min(3.5, weight * 0.7)) : 0.7;
        }
        ctx.beginPath();
        ctx.moveTo(edge.a.x, edge.a.y);
        ctx.lineTo(edge.b.x, edge.b.y);
        ctx.stroke();
      }
      for (const node of simNodes) {
        if (node.type === "note") {
          ctx.shadowBlur = 18;
          ctx.shadowColor = withAlpha(colors.accent, 0.7);
          ctx.fillStyle = colors.accent;
        } else if (node.type === "article") {
          const rank = node.rank ?? maxRank;
          const t = maxRank > 1 ? (maxRank - rank) / (maxRank - 1) : 1;
          ctx.shadowBlur = 10;
          ctx.shadowColor = withAlpha(colors.primary, 0.5);
          ctx.fillStyle = withAlpha(colors.primary, 0.55 + 0.45 * t);
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = node.inNote ? colors.acorn : withAlpha(colors.muted, 0.75);
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (node.type === "article" && node.rank != null) {
          ctx.fillStyle = colors.primaryFg;
          ctx.font = '700 10px "JetBrains Mono", ui-monospace, monospace';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(node.rank), node.x, node.y + 0.5);
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        if (node.type === "note") {
          ctx.fillStyle = colors.fg;
          ctx.font = '700 12px "Pretendard", sans-serif';
          ctx.fillText(truncate(node.label, 16), node.x, node.y + node.r + 5);
        } else if (node.type === "keyword" && (node.inNote || node.r >= 8)) {
          ctx.fillStyle = node.inNote ? colors.fg : colors.muted;
          ctx.font = `${node.inNote ? "600 " : ""}11px "Pretendard", sans-serif`;
          ctx.fillText(truncate(node.label, 12), node.x, node.y + node.r + 4);
        }
      }
    }

    function loop() {
      step();
      draw();
      frame = requestAnimationFrame(loop);
    }

    function resize() {
      const nextWidth = container!.clientWidth;
      const nextHeight = container!.clientHeight;
      if (nextWidth === 0 || nextHeight === 0) return;
      width = nextWidth;
      height = nextHeight;
      colors = readColors(container!);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!initialized) {
        layoutInit();
        for (let i = 0; i < 320; i++) step();
        initialized = true;
      } else {
        for (const node of simNodes) {
          node.x = Math.max(MARGIN, Math.min(width - MARGIN, node.x));
          node.y = Math.max(MARGIN, Math.min(height - MARGIN, node.y));
        }
      }
    }

    function pointerPos(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function nodeAt(px: number, py: number): SimNode | null {
      for (let i = simNodes.length - 1; i >= 0; i--) {
        const node = simNodes[i];
        const dx = px - node.x;
        const dy = py - node.y;
        const reach = node.r + 6;
        if (dx * dx + dy * dy <= reach * reach) return node;
      }
      return null;
    }

    function onPointerDown(event: PointerEvent) {
      const p = pointerPos(event);
      const node = nodeAt(p.x, p.y);
      if (!node) return;
      dragging = node;
      pressNode = node;
      pressX = p.x;
      pressY = p.y;
      moved = false;
      node.vx = 0;
      node.vy = 0;
      canvas!.setPointerCapture(event.pointerId);
      canvas!.style.cursor = "grabbing";
      setTip(null);
    }

    function onPointerMove(event: PointerEvent) {
      const p = pointerPos(event);
      if (dragging) {
        dragging.x = p.x;
        dragging.y = p.y;
        if (Math.abs(p.x - pressX) > 4 || Math.abs(p.y - pressY) > 4) moved = true;
        return;
      }
      const node = nodeAt(p.x, p.y);
      if (node) {
        setTip({
          x: node.x,
          y: node.y - node.r,
          title: truncate(node.label, 40),
          meta:
            node.type === "note"
              ? "내 노트"
              : node.type === "article"
                ? `추천 ${node.rank ?? "-"}위`
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

    function onPointerUp() {
      if (pressNode && !moved) {
        if (pressNode.type === "article") {
          routerRef.current.push(`/article/${idPart(pressNode.id)}`);
        } else if (pressNode.type === "keyword") {
          routerRef.current.push(`/keyword/${idPart(pressNode.id)}`);
        }
      }
      dragging = null;
      pressNode = null;
      canvas!.style.cursor = "grab";
    }

    function onPointerLeave() {
      setTip(null);
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    loop();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [nodes, edges]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[480px] sm:h-[580px] overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <canvas ref={canvasRef} className="block h-full w-full touch-none" style={{ cursor: "grab" }} />
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
