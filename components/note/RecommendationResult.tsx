"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getNoteGraph } from "@/lib/api/notes";
import type { NoteGraph, NoteRecommendation } from "@/lib/types";
import { RecommendedArticleCard } from "@/components/note/RecommendedArticleCard";
import { KnowledgeGraph } from "@/components/note/KnowledgeGraph";

type View = "list" | "map";
type Status = "idle" | "loading" | "ready" | "error";

export function RecommendationResult({
  noteId,
  recommendation,
}: {
  noteId: number;
  recommendation: NoteRecommendation;
}) {
  const { getIdToken } = useAuth();
  const [view, setView] = useState<View>("list");
  const [graphStatus, setGraphStatus] = useState<Status>("idle");
  const [graph, setGraph] = useState<NoteGraph | null>(null);

  const loadGraph = useCallback(async () => {
    setGraphStatus("loading");
    try {
      const token = await getIdToken();
      if (!token) {
        setGraphStatus("error");
        return;
      }
      setGraph(await getNoteGraph(token, noteId));
      setGraphStatus("ready");
    } catch {
      setGraphStatus("error");
    }
  }, [getIdToken, noteId]);

  useEffect(() => {
    if (view === "map" && graphStatus === "idle") loadGraph();
  }, [view, graphStatus, loadGraph]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-acorn m-0">Keywords</p>
        <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
          <button
            onClick={() => setView("list")}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors ${
              view === "list" ? "bg-card text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            목록
          </button>
          <button
            onClick={() => setView("map")}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors ${
              view === "map" ? "bg-card text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            지식 지도
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {recommendation.keywords.map((keyword) => (
          <span key={keyword} className="font-mono text-xs text-primary bg-primary-soft px-2 py-1 rounded-md">
            {keyword}
          </span>
        ))}
      </div>

      <div className="border-t border-border my-4" />

      {view === "list" ? (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-acorn mb-1">
            관련 글 · {recommendation.articles.length}
          </p>
          {recommendation.articles.length > 0 ? (
            <div className="flex flex-col">
              {recommendation.articles.map((article, index) => (
                <RecommendedArticleCard key={article.articleId} article={article} divider={index > 0} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted mt-2">이 키워드와 겹치는 줍줍한 글이 아직 없어요.</p>
          )}
        </>
      ) : (
        <MapView status={graphStatus} graph={graph} onRetry={loadGraph} />
      )}
    </div>
  );
}

function MapView({
  status,
  graph,
  onRetry,
}: {
  status: Status;
  graph: NoteGraph | null;
  onRetry: () => void;
}) {
  if (status === "idle" || status === "loading") {
    return <div className="w-full h-[380px] rounded-2xl bg-skeleton animate-pulse" />;
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted m-0">지도를 불러오지 못했어요.</p>
        <button onClick={onRetry} className="text-sm font-semibold text-primary hover:opacity-80">
          다시 시도
        </button>
      </div>
    );
  }
  const hasContent = !!graph && graph.nodes.some((node) => node.type !== "note");
  if (!hasContent) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-12 bg-surface border border-border rounded-2xl">
        <p className="text-sm text-muted m-0">아직 지도로 그릴 키워드가 없어요.</p>
        <Link href="/explore" className="text-sm font-semibold text-primary no-underline">
          탐색하러 가기 →
        </Link>
      </div>
    );
  }
  return (
    <div>
      <KnowledgeGraph nodes={graph.nodes} edges={graph.edges} />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-2.5 h-2.5 rounded-full bg-accent" />내 노트
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-2.5 h-2.5 rounded-full bg-acorn" />노트 키워드
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-2.5 h-2.5 rounded-full bg-muted" />관련 키워드
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />추천 글
        </span>
        <span className="ml-auto font-mono">드래그 · 호버 · 클릭</span>
      </div>
    </div>
  );
}
