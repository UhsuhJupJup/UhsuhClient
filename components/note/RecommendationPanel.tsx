"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getRecommendations } from "@/lib/api/notes";
import type { Note, NoteRecommendation } from "@/lib/types";
import { RecommendedArticleCard } from "@/components/note/RecommendedArticleCard";

type Status = "idle" | "loading" | "ready" | "error";

export function RecommendationPanel({
  selectedNote,
  onClose,
  onAnalyzed,
}: {
  selectedNote: Note | null;
  onClose: () => void;
  onAnalyzed?: (noteId: number, keywords: string[]) => void;
}) {
  const { getIdToken } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<NoteRecommendation | null>(null);
  const onAnalyzedRef = useRef(onAnalyzed);

  useEffect(() => {
    onAnalyzedRef.current = onAnalyzed;
  });

  const selectedId = selectedNote?.id ?? null;
  useEffect(() => {
    setStatus("idle");
    setData(null);
  }, [selectedId]);

  const jubjub = async () => {
    if (selectedId == null) return;
    setStatus("loading");
    setData(null);
    try {
      const token = await getIdToken();
      if (!token) {
        setStatus("error");
        return;
      }
      const result = await getRecommendations(token, selectedId);
      setData(result);
      setStatus("ready");
      onAnalyzedRef.current?.(selectedId, result.keywords);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 lg:max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-extrabold m-0">AI로 관련 글 줍줍하기</h2>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-muted hover:bg-chip-bg hover:text-fg transition-colors"
        >
          ✕
        </button>
      </div>

      {!selectedNote ? (
        <p className="text-sm text-muted text-center py-10">왼쪽 목록에서 노트를 선택하세요.</p>
      ) : (
        <>
          <div className="border border-border rounded-xl p-3 bg-surface">
            <p className="font-semibold text-sm text-fg m-0 line-clamp-2">{selectedNote.title}</p>
          </div>
          <button
            onClick={jubjub}
            disabled={status === "loading"}
            className="mt-3 w-full inline-flex items-center justify-center bg-primary text-primary-fg px-4 py-2 rounded-[9px] font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {status === "loading" ? "줍줍하는 중…" : "줍줍하기"}
          </button>

          {status === "loading" && (
            <div className="mt-5 flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="border border-border rounded-xl p-3 flex flex-col gap-2">
                  <div className="h-3 w-20 bg-skeleton rounded" />
                  <div className="h-4 w-full bg-skeleton rounded" />
                </div>
              ))}
            </div>
          )}

          {status === "error" && (
            <div className="mt-5 flex items-center gap-3">
              <p className="text-sm text-muted m-0">불러오지 못했어요.</p>
              <button onClick={jubjub} className="text-sm font-semibold text-primary hover:opacity-80">
                다시 시도
              </button>
            </div>
          )}

          {status === "ready" && data && (
            <div className="mt-5">
              {data.keywords.length === 0 ? (
                <p className="text-sm text-muted">이 노트에서 키워드를 추출하지 못했어요.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-1.5 text-sm text-fg">
                    <span>해당 글은</span>
                    {data.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="font-mono text-xs text-primary bg-primary-soft px-2 py-1 rounded-md"
                      >
                        {keyword}
                      </span>
                    ))}
                    <span>키워드로 분류됐습니다.</span>
                  </div>

                  <p className="mt-6 mb-3 text-sm font-bold text-fg">관련 글입니다.</p>
                  {data.articles.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {data.articles.map((article) => (
                        <RecommendedArticleCard key={article.articleId} article={article} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">이 키워드와 겹치는 줍줍한 글이 아직 없어요.</p>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
