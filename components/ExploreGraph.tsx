"use client";

import { useEffect, useState } from "react";
import { getGlobalGraph } from "@/lib/api/graph";
import type { NoteGraph } from "@/lib/types";
import { KnowledgeGraph } from "@/components/note/KnowledgeGraph";

type Status = "loading" | "ready" | "error";

const panelClass =
  "h-[480px] sm:h-[580px] rounded-2xl border border-border bg-surface grid place-items-center text-muted";

export function ExploreGraph() {
  const [graph, setGraph] = useState<NoteGraph | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;
    getGlobalGraph()
      .then((result) => {
        if (!active) return;
        setGraph(result);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: "var(--muted)", opacity: 0.75 }} />
          키워드 · 크기는 글 수, 선은 함께 등장한 정도예요
        </span>
        <span className="ml-auto font-mono text-xs">드래그 · 호버 · 클릭</span>
      </div>
      {status === "loading" && <div className={panelClass}>그래프를 그리는 중…</div>}
      {status === "error" && <div className={panelClass}>그래프를 불러오지 못했어요.</div>}
      {status === "ready" &&
        graph &&
        (graph.nodes.length === 0 ? (
          <div className={panelClass}>아직 그래프에 표시할 글이 없어요.</div>
        ) : (
          <KnowledgeGraph nodes={graph.nodes} edges={graph.edges} />
        ))}
    </div>
  );
}
