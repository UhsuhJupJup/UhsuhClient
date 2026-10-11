"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { getKeywordGraph, getTopKeyword } from "@/lib/api/keywords";
import { ApiError } from "@/lib/api/client";
import type { KeywordGraph, TopKeyword } from "@/lib/types";
import {
  createExplorerState,
  explorerReducer,
  type Viewport,
} from "@/components/keyword/keywordGraphModel";
import { useKeywordSummaries } from "@/components/keyword/useKeywordSummaries";
import { KeywordGraphView } from "@/components/keyword/KeywordGraphView";
import { KeywordSummaryPanel } from "@/components/keyword/KeywordSummaryPanel";

type Boot =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error" }
  | { status: "ready"; start: TopKeyword };

const placeholderClass =
  "min-h-[380px] rounded-2xl border border-border bg-surface grid place-items-center content-center gap-3 px-4 text-center text-muted";
const buttonClass =
  "rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-semibold text-fg cursor-pointer transition-colors hover:border-primary hover:text-primary";

export function KeywordGraphExplorer() {
  const [boot, setBoot] = useState<Boot>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getTopKeyword().then(
      (start) => {
        if (active) setBoot({ status: "ready", start });
      },
      (error: unknown) => {
        if (!active) return;
        const empty = error instanceof ApiError && error.status === 404;
        setBoot({ status: empty ? "empty" : "error" });
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = () => {
    setBoot({ status: "loading" });
    setAttempt((count) => count + 1);
  };

  return (
    <div className="mt-6">
      {boot.status === "loading" && <div className={placeholderClass}>그래프를 그리는 중…</div>}
      {boot.status === "empty" && (
        <div className={placeholderClass}>아직 그래프에 표시할 글이 없어요.</div>
      )}
      {boot.status === "error" && (
        <div role="alert" className={placeholderClass}>
          그래프를 불러오지 못했어요.
          <button type="button" onClick={retry} className={buttonClass}>
            다시 시도
          </button>
        </div>
      )}
      {boot.status === "ready" && <KeywordGraphSession key={boot.start.id} start={boot.start} />}
    </div>
  );
}

function KeywordGraphSession({ start }: { start: TopKeyword }) {
  const [state, dispatch] = useReducer(explorerReducer, start, createExplorerState);
  const { summaries, loadSummary, retrySummary } = useKeywordSummaries();
  const epochRef = useRef(0);
  const inFlightRef = useRef(new Set<number>());
  const startGraphRef = useRef<KeywordGraph | null>(null);

  const fetchGraph = useCallback(
    (id: number, name: string) => {
      if (inFlightRef.current.has(id)) return;
      inFlightRef.current.add(id);
      const epoch = epochRef.current;
      getKeywordGraph(id).then(
        (graph) => {
          if (epochRef.current !== epoch) return;
          inFlightRef.current.delete(id);
          if (id === start.id) startGraphRef.current = graph;
          dispatch({ type: "merged", id, graph });
        },
        () => {
          if (epochRef.current !== epoch) return;
          inFlightRef.current.delete(id);
          dispatch({ type: "failed", id, name });
        },
      );
    },
    [start.id],
  );

  useEffect(() => {
    fetchGraph(start.id, start.name);
    loadSummary(start.id);
  }, [fetchGraph, loadSummary, start.id, start.name]);

  const pick = (id: number, name: string) => {
    loadSummary(id);
    if (state.model.nodes.get(id)?.expanded) {
      dispatch({ type: "selected", id });
      return;
    }
    dispatch({ type: "requested", id });
    fetchGraph(id, name);
  };

  const reset = () => {
    epochRef.current += 1;
    inFlightRef.current = new Set();
    const graph = startGraphRef.current;
    dispatch({ type: "restored", start, graph });
    loadSummary(start.id);
    if (!graph) fetchGraph(start.id, start.name);
  };

  const reveal = useCallback((id: number) => dispatch({ type: "revealed", id }), []);
  const resize = useCallback((viewport: Viewport) => dispatch({ type: "resized", viewport }), []);
  const pan = useCallback((dx: number, dy: number) => dispatch({ type: "panned", dx, dy }), []);
  const zoom = useCallback(
    (factor: number, anchorX: number, anchorY: number) =>
      dispatch({ type: "zoomed", factor, anchorX, anchorY }),
    [],
  );

  const selectedName = state.model.nodes.get(state.selectedId)?.name ?? start.name;
  const loadingName = [...state.loadingIds]
    .filter((id) => id === state.pendingId || id === state.selectedId)
    .map((id) => state.model.nodes.get(id)?.name)
    .find((name) => name !== undefined);

  return (
    <div className="grid grid-cols-1 items-start gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid min-w-0 overflow-hidden rounded-2xl border border-border bg-surface">
        <KeywordGraphView
          model={state.model}
          camera={state.camera}
          viewport={state.viewport}
          selectedId={state.selectedId}
          loadingIds={state.loadingIds}
          onPick={pick}
          onReveal={reveal}
          onResize={resize}
          onPan={pan}
          onZoom={zoom}
        />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border bg-card px-3.5 py-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
            <span role="status" className="[overflow-wrap:anywhere]">
              {state.failed
                ? `${state.failed.name} 그래프를 불러오지 못했어요.`
                : loadingName !== undefined
                  ? `${loadingName} 그래프를 불러오는 중…`
                  : ""}
            </span>
            {state.failed && (
              <button
                type="button"
                onClick={() => state.failed && pick(state.failed.id, state.failed.name)}
                className={buttonClass}
              >
                다시 시도
              </button>
            )}
          </div>
          <button type="button" onClick={reset} className={`ml-auto ${buttonClass}`}>
            처음으로
          </button>
        </div>
      </div>
      <KeywordSummaryPanel
        keywordId={state.selectedId}
        keywordName={selectedName}
        summary={summaries.get(state.selectedId)}
        onPick={pick}
        onRetry={retrySummary}
      />
    </div>
  );
}
