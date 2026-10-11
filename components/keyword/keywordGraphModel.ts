import type { KeywordGraph, KeywordNeighborLink, TopKeyword } from "@/lib/types";

export interface GraphNode {
  id: number;
  name: string;
  weight: number;
  expanded: boolean;
  x: number;
  y: number;
  originX: number;
  originY: number;
  enteredBatch: number;
  enterOrder: number;
  enterTotal: number;
}

export interface GraphLink {
  a: number;
  b: number;
  weight: number;
}

export interface NodeBox {
  font: number;
  width: number;
  height: number;
}

export interface GraphModel {
  nodes: ReadonlyMap<number, GraphNode>;
  links: ReadonlyMap<string, GraphLink>;
  neighborLinks: ReadonlyMap<number, KeywordNeighborLink[]>;
  scaleWeight: number;
  batch: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface FailedExpansion {
  id: number;
  name: string;
}

export interface ExplorerState {
  model: GraphModel;
  camera: Camera;
  viewport: Viewport;
  selectedId: number;
  pendingId: number | null;
  loadingIds: ReadonlySet<number>;
  failed: FailedExpansion | null;
}

export type ExplorerAction =
  | { type: "requested"; id: number }
  | { type: "merged"; id: number; graph: KeywordGraph }
  | { type: "failed"; id: number; name: string }
  | { type: "selected"; id: number }
  | { type: "restored"; start: TopKeyword; graph: KeywordGraph | null }
  | { type: "resized"; viewport: Viewport }
  | { type: "revealed"; id: number }
  | { type: "panned"; dx: number; dy: number }
  | { type: "zoomed"; factor: number; anchorX: number; anchorY: number };

const DEFAULT_VIEWPORT: Viewport = { width: 760, height: 560 };
const SETTLED_BATCH = -1;
const MIN_FONT = 12;
const FONT_RANGE = 5;
const LABEL_PADDING_X = 22;
const LABEL_PADDING_Y = 16;
const RING_RADIUS = 118;
const RING_STEP = 58;
const RING_COUNT = 7;
const FAR_RING_COUNT = 60;
const RING_STRETCH = 1.3;
const ANGLE_STEP = Math.PI / 18;
const ANGLE_SLOTS = 18;
const RING_COST = Math.PI / 4;
const NODE_GAP_X = 14;
const NODE_GAP_Y = 10;
const ARC_PER_NODE = Math.PI / 6.5;
const MIN_ARC = (Math.PI * 2) / 3;
const MAX_ARC = (Math.PI * 5) / 3;
const VIEW_MARGIN = 20;
const MIN_FIT_ZOOM = 0.55;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.8;
const WIDE_CHARACTER = /[\u1100-\uffff]/;
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

export function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

export function nodeColor(name: string): string {
  let hash = 0;
  for (const ch of name) {
    hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

function labelWidth(name: string, font: number): number {
  let width = 0;
  for (const ch of name) {
    width += WIDE_CHARACTER.test(ch) ? font : font * 0.62;
  }
  return width;
}

function boxOf(name: string, font: number): NodeBox {
  return { font, width: labelWidth(name, font) + LABEL_PADDING_X, height: font + LABEL_PADDING_Y };
}

export function nodeBox(node: GraphNode, scaleWeight: number): NodeBox {
  const scale = Math.sqrt(Math.min(1, Math.max(0, node.weight) / Math.max(1, scaleWeight)));
  return boxOf(node.name, MIN_FONT + Math.round(scale * FONT_RANGE));
}

function reservedBox(name: string): NodeBox {
  return boxOf(name, MIN_FONT + FONT_RANGE);
}

function overlaps(x: number, y: number, box: NodeBox, placed: GraphNode[]): boolean {
  return placed.some((other) => {
    const otherBox = reservedBox(other.name);
    return (
      Math.abs(x - other.x) < (box.width + otherBox.width) / 2 + NODE_GAP_X &&
      Math.abs(y - other.y) < (box.height + otherBox.height) / 2 + NODE_GAP_Y
    );
  });
}

const SLOT_OFFSETS = (() => {
  const offsets: { ring: number; turn: number; cost: number }[] = [];
  for (let ring = 0; ring < RING_COUNT; ring += 1) {
    for (let slot = 0; slot <= ANGLE_SLOTS; slot += 1) {
      const turn = slot * ANGLE_STEP;
      offsets.push({ ring, turn, cost: ring * RING_COST + turn });
      if (slot > 0 && slot < ANGLE_SLOTS) {
        offsets.push({ ring, turn: -turn, cost: ring * RING_COST + turn + ANGLE_STEP / 4 });
      }
    }
  }
  return offsets.sort((a, b) => a.cost - b.cost);
})();

function findFreeSpot(
  center: GraphNode,
  angle: number,
  name: string,
  placed: GraphNode[],
): { x: number; y: number } {
  const box = reservedBox(name);
  for (const offset of SLOT_OFFSETS) {
    const radius = RING_RADIUS + offset.ring * RING_STEP;
    const x = center.x + Math.cos(angle + offset.turn) * radius * RING_STRETCH;
    const y = center.y + Math.sin(angle + offset.turn) * radius;
    if (!overlaps(x, y, box, placed)) return { x, y };
  }
  for (let ring = RING_COUNT; ring < FAR_RING_COUNT; ring += 1) {
    const radius = RING_RADIUS + ring * RING_STEP;
    for (let slot = 0; slot < ANGLE_SLOTS * 2; slot += 1) {
      const turn = angle + slot * ANGLE_STEP;
      const x = center.x + Math.cos(turn) * radius * RING_STRETCH;
      const y = center.y + Math.sin(turn) * radius;
      if (!overlaps(x, y, box, placed)) return { x, y };
    }
  }
  const radius = RING_RADIUS + FAR_RING_COUNT * RING_STEP;
  return {
    x: center.x + Math.cos(angle) * radius * RING_STRETCH,
    y: center.y + Math.sin(angle) * radius,
  };
}

function desiredAngles(center: GraphNode, others: GraphNode[], count: number): number[] {
  if (others.length === 0) {
    return Array.from({ length: count }, (_, index) => -Math.PI / 2 + (index / count) * Math.PI * 2);
  }
  const cx = others.reduce((sum, node) => sum + node.x, 0) / others.length;
  const cy = others.reduce((sum, node) => sum + node.y, 0) / others.length;
  const outward =
    Math.hypot(center.x - cx, center.y - cy) < 1 ? -Math.PI / 2 : Math.atan2(center.y - cy, center.x - cx);
  const arc = Math.min(MAX_ARC, Math.max(MIN_ARC, count * ARC_PER_NODE));
  return Array.from({ length: count }, (_, index) =>
    count === 1 ? outward : outward - arc / 2 + (index / (count - 1)) * arc,
  );
}

function startModel(start: TopKeyword, batch: number): GraphModel {
  const node: GraphNode = {
    id: start.id,
    name: start.name,
    weight: start.articleCount,
    expanded: false,
    x: 0,
    y: 0,
    originX: 0,
    originY: 0,
    enteredBatch: SETTLED_BATCH,
    enterOrder: 0,
    enterTotal: 0,
  };
  return {
    nodes: new Map([[node.id, node]]),
    links: new Map(),
    neighborLinks: new Map(),
    scaleWeight: Math.max(1, start.articleCount),
    batch,
  };
}

function placeCenter(model: GraphModel, graph: KeywordGraph, batch: number, animate: boolean): GraphNode {
  const known = model.nodes.get(graph.center.id);
  const base = { id: graph.center.id, name: graph.center.name, weight: graph.center.articleCount, expanded: true };
  if (known) {
    return { ...known, ...base };
  }
  const anchor = model.nodes.values().next().value;
  if (!anchor) {
    return { ...base, x: 0, y: 0, originX: 0, originY: 0, enteredBatch: SETTLED_BATCH, enterOrder: 0, enterTotal: 0 };
  }
  const spot = findFreeSpot(anchor, -Math.PI / 2, graph.center.name, [...model.nodes.values()]);
  return {
    ...base,
    x: spot.x,
    y: spot.y,
    originX: anchor.x,
    originY: anchor.y,
    enteredBatch: animate ? batch : SETTLED_BATCH,
    enterOrder: 0,
    enterTotal: 1,
  };
}

function mergeGraph(model: GraphModel, graph: KeywordGraph, animate: boolean): GraphModel {
  const batch = model.batch + 1;
  const nodes = new Map(model.nodes);
  const center = placeCenter(model, graph, batch, animate);
  nodes.set(center.id, center);

  const links = new Map(model.links);
  const fresh = graph.neighbors.filter((neighbor) => neighbor.id !== center.id && !nodes.has(neighbor.id));
  const others = [...nodes.values()].filter((node) => node.id !== center.id);
  const angles = desiredAngles(center, others, fresh.length);
  const placed = [...nodes.values()];

  fresh.forEach((neighbor, index) => {
    const spot = findFreeSpot(center, angles[index], neighbor.name, placed);
    const node: GraphNode = {
      id: neighbor.id,
      name: neighbor.name,
      weight: neighbor.sharedArticleCount,
      expanded: false,
      x: spot.x,
      y: spot.y,
      originX: center.x,
      originY: center.y,
      enteredBatch: animate ? batch : SETTLED_BATCH,
      enterOrder: index,
      enterTotal: fresh.length,
    };
    nodes.set(node.id, node);
    placed.push(node);
  });

  for (const neighbor of graph.neighbors) {
    if (neighbor.id === center.id) continue;
    links.set(pairKey(center.id, neighbor.id), {
      a: center.id,
      b: neighbor.id,
      weight: neighbor.sharedArticleCount,
    });
  }

  const neighborLinks = new Map(model.neighborLinks);
  neighborLinks.set(center.id, graph.neighborLinks);

  return {
    nodes,
    links,
    neighborLinks,
    scaleWeight: model.scaleWeight,
    batch,
  };
}

export function contextLinks(model: GraphModel, selectedId: number): GraphLink[] {
  const between = model.neighborLinks.get(selectedId) ?? [];
  return between
    .filter(
      (link) =>
        model.nodes.has(link.sourceId) &&
        model.nodes.has(link.targetId) &&
        !model.links.has(pairKey(link.sourceId, link.targetId)),
    )
    .map((link) => ({ a: link.sourceId, b: link.targetId, weight: link.sharedArticleCount }));
}

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function boundsOf(nodes: Iterable<GraphNode>): Bounds | null {
  const bounds: Bounds = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
  for (const node of nodes) {
    const box = reservedBox(node.name);
    bounds.left = Math.min(bounds.left, node.x - box.width / 2);
    bounds.right = Math.max(bounds.right, node.x + box.width / 2);
    bounds.top = Math.min(bounds.top, node.y - box.height / 2);
    bounds.bottom = Math.max(bounds.bottom, node.y + box.height / 2);
  }
  return bounds.left > bounds.right ? null : bounds;
}

function isVisible(bounds: Bounds, camera: Camera, viewport: Viewport): boolean {
  const halfWidth = (viewport.width / 2 - VIEW_MARGIN) / camera.zoom;
  const halfHeight = (viewport.height / 2 - VIEW_MARGIN) / camera.zoom;
  return (
    bounds.left >= camera.x - halfWidth &&
    bounds.right <= camera.x + halfWidth &&
    bounds.top >= camera.y - halfHeight &&
    bounds.bottom <= camera.y + halfHeight
  );
}

function centerOf(bounds: Bounds, zoom: number): Camera {
  return { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2, zoom };
}

function neighborhoodOf(model: GraphModel, focusId: number): GraphNode[] {
  return [...model.nodes.values()].filter(
    (node) => node.id === focusId || model.links.has(pairKey(focusId, node.id)),
  );
}

function fitCamera(model: GraphModel, viewport: Viewport, focusId: number): Camera {
  const bounds = boundsOf(model.nodes.values());
  if (!bounds) return { x: 0, y: 0, zoom: 1 };
  const zoom = fitZoom(bounds, viewport, 1);
  if (zoom >= MIN_FIT_ZOOM) return centerOf(bounds, zoom);
  return centerOf(boundsOf(neighborhoodOf(model, focusId)) ?? bounds, MIN_FIT_ZOOM);
}

function fitZoom(bounds: Bounds, viewport: Viewport, limit: number): number {
  return Math.min(
    limit,
    (viewport.width - VIEW_MARGIN * 2) / (bounds.right - bounds.left),
    (viewport.height - VIEW_MARGIN * 2) / (bounds.bottom - bounds.top),
  );
}

function slideInto(low: number, high: number, center: number, half: number): number {
  if (high - low > half * 2) return (low + high) / 2;
  if (low < center - half) return low + half;
  if (high > center + half) return high - half;
  return center;
}

function arrivalsOf(model: GraphModel, centerId: number): GraphNode[] {
  return [...model.nodes.values()].filter(
    (node) => node.id === centerId || node.enteredBatch === model.batch,
  );
}

function keepVisible(camera: Camera, viewport: Viewport, mustShow: GraphNode[]): Camera {
  const bounds = boundsOf(mustShow);
  if (!bounds || isVisible(bounds, camera, viewport)) return camera;
  const zoom = Math.max(Math.min(camera.zoom, MIN_FIT_ZOOM), fitZoom(bounds, viewport, camera.zoom));
  const halfWidth = (viewport.width / 2 - VIEW_MARGIN) / zoom;
  const halfHeight = (viewport.height / 2 - VIEW_MARGIN) / zoom;
  return {
    x: slideInto(bounds.left, bounds.right, camera.x, halfWidth),
    y: slideInto(bounds.top, bounds.bottom, camera.y, halfHeight),
    zoom,
  };
}

export function cameraTransform(camera: Camera, viewport: Viewport): string {
  const x = viewport.width / 2 - camera.x * camera.zoom;
  const y = viewport.height / 2 - camera.y * camera.zoom;
  return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${camera.zoom.toFixed(4)})`;
}

export function createExplorerState(start: TopKeyword): ExplorerState {
  return startState(start, 0);
}

function startState(start: TopKeyword, batch: number): ExplorerState {
  return {
    model: startModel(start, batch),
    camera: { x: 0, y: 0, zoom: 1 },
    viewport: DEFAULT_VIEWPORT,
    selectedId: start.id,
    pendingId: null,
    loadingIds: new Set([start.id]),
    failed: null,
  };
}

function without(ids: ReadonlySet<number>, id: number): ReadonlySet<number> {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

export function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case "requested":
      return {
        ...state,
        pendingId: action.id === state.selectedId ? null : action.id,
        loadingIds: new Set([...state.loadingIds, action.id]),
        failed: null,
      };
    case "merged": {
      const picked = state.pendingId === action.id;
      const model = mergeGraph(state.model, action.graph, true);
      const first = state.model.links.size === 0;
      return {
        ...state,
        model,
        camera: first
          ? fitCamera(model, state.viewport, action.graph.center.id)
          : keepVisible(state.camera, state.viewport, arrivalsOf(model, action.graph.center.id)),
        selectedId: picked ? action.graph.center.id : state.selectedId,
        pendingId: picked ? null : state.pendingId,
        loadingIds: without(state.loadingIds, action.id),
        failed: state.failed?.id === action.id ? null : state.failed,
      };
    }
    case "failed":
      return {
        ...state,
        pendingId: state.pendingId === action.id ? null : state.pendingId,
        loadingIds: without(state.loadingIds, action.id),
        failed: { id: action.id, name: action.name },
      };
    case "selected":
      return { ...state, selectedId: action.id, pendingId: null, failed: null };
    case "restored": {
      const initial = { ...startState(action.start, state.model.batch), viewport: state.viewport };
      if (!action.graph) return initial;
      const model = mergeGraph(initial.model, action.graph, false);
      return {
        ...initial,
        model,
        camera: fitCamera(model, state.viewport, action.start.id),
        loadingIds: new Set(),
      };
    }
    case "resized": {
      const same =
        Math.abs(action.viewport.width - state.viewport.width) < 1 &&
        Math.abs(action.viewport.height - state.viewport.height) < 1;
      if (same) return state;
      return {
        ...state,
        viewport: action.viewport,
        camera: keepVisible(state.camera, action.viewport, neighborhoodOf(state.model, state.selectedId)),
      };
    }
    case "revealed": {
      const node = state.model.nodes.get(action.id);
      if (!node) return state;
      return { ...state, camera: keepVisible(state.camera, state.viewport, [node]) };
    }
    case "panned":
      return {
        ...state,
        camera: {
          ...state.camera,
          x: state.camera.x - action.dx / state.camera.zoom,
          y: state.camera.y - action.dy / state.camera.zoom,
        },
      };
    case "zoomed": {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.camera.zoom * action.factor));
      const offsetX = action.anchorX - state.viewport.width / 2;
      const offsetY = action.anchorY - state.viewport.height / 2;
      return {
        ...state,
        camera: {
          x: state.camera.x + offsetX / state.camera.zoom - offsetX / zoom,
          y: state.camera.y + offsetY / state.camera.zoom - offsetY / zoom,
          zoom,
        },
      };
    }
  }
}
