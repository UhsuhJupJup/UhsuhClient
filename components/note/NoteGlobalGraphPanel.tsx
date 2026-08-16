"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getMyGraph } from "@/lib/api/graph";
import type { NoteGraph } from "@/lib/types";
import { KnowledgeGraph } from "@/components/note/KnowledgeGraph";

type Status = "loading" | "ready" | "error";

const panelClass =
  "h-[460px] sm:h-[560px] rounded-2xl border border-border bg-surface grid place-items-center text-muted";

export function NoteGlobalGraphPanel({ onClose }: { onClose?: () => void }) {
  const { getIdToken } = useAuth();
  const [graph, setGraph] = useState<NoteGraph | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;
    getIdToken()
      .then((token) => (token ? getMyGraph(token) : Promise.reject(new Error("no token"))))
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
  }, [getIdToken]);

  return (
    <section className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold m-0">전체 지식 그래프</h2>
          <p className="text-xs text-muted mt-0.5 m-0">내 노트를 얹은 전체 키워드 지도예요. 노드 크기는 글 수.</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="닫기"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-muted hover:bg-chip-bg hover:text-fg transition-colors shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {status === "loading" && <div className={panelClass}>그래프를 그리는 중…</div>}
      {status === "error" && <div className={panelClass}>그래프를 불러오지 못했어요.</div>}
      {status === "ready" &&
        graph &&
        (graph.nodes.length === 0 ? (
          <div className={panelClass}>아직 그래프에 표시할 글이 없어요.</div>
        ) : (
          <div>
            <KnowledgeGraph nodes={graph.nodes} edges={graph.edges} />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <i className="inline-block w-2.5 h-2.5 rounded-full bg-accent" />내 노트
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i className="inline-block w-2.5 h-2.5 rounded-full bg-acorn" />내 노트 키워드
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i className="inline-block w-2.5 h-2.5 rounded-full bg-muted" />키워드
              </span>
              <span className="ml-auto font-mono">빈 곳 드래그 이동 · 휠 확대/축소 · 노드 클릭</span>
            </div>
          </div>
        ))}
    </section>
  );
}
