"use client";

import { useEffect, useState } from "react";
import { getTopicsWithKeywords } from "@/lib/api/topics";
import { searchKeywords } from "@/lib/api/keywords";
import type { Keyword, TopicDetail } from "@/lib/types";

export function KeywordPicker({
  selected,
  onToggleKeyword,
  onToggleTopic,
}: {
  selected: Map<number, string>;
  onToggleKeyword: (id: number, name: string) => void;
  onToggleTopic: (topic: TopicDetail) => void;
}) {
  const [allTopics, setAllTopics] = useState<TopicDetail[]>([]);
  const [topicQuery, setTopicQuery] = useState("");
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getTopicsWithKeywords()
      .then((topics) => {
        if (active) setAllTopics(topics);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    let active = true;
    searchKeywords(trimmed)
      .then((keywords) => {
        if (active) setResults(keywords);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    if (!topicModalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTopicModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [topicModalOpen]);

  const topicFilter = topicQuery.trim().toLowerCase();
  const filteredTopics = topicFilter
    ? allTopics.filter((topic) => topic.name.toLowerCase().includes(topicFilter))
    : allTopics;

  const selectedTopicCount = allTopics.filter(
    (topic) => topic.keywords.length > 0 && topic.keywords.every((keyword) => selected.has(keyword.id)),
  ).length;

  return (
    <>
      <p className="text-sm font-semibold text-muted mb-1">키워드 묶음으로 구독하세요</p>
      <p className="text-xs text-muted mb-3">토픽을 누르면 그 토픽의 키워드가 한 번에 담겨요.</p>

      <button
        type="button"
        onClick={() => setTopicModalOpen(true)}
        disabled={loading}
        className="w-full flex items-center justify-between gap-2 bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-fg hover:border-primary transition-colors disabled:opacity-40"
      >
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>🗂️</span>
          토픽으로 선택
        </span>
        <span className="text-xs font-semibold text-muted">
          {loading ? "불러오는 중…" : selectedTopicCount > 0 ? `${selectedTopicCount}개 담김 · 열기` : "열기"}
        </span>
      </button>

      {topicModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setTopicModalOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="토픽 선택"
            onClick={(event) => event.stopPropagation()}
            className="bg-card border border-border rounded-2xl w-full max-w-[720px] max-h-[85vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center justify-between gap-3 p-5 border-b border-border">
              <div>
                <h3 className="text-base font-extrabold m-0">토픽으로 선택</h3>
                <p className="text-xs text-muted mt-1 mb-0">토픽을 누르면 그 토픽의 키워드가 한 번에 담겨요.</p>
              </div>
              <button
                type="button"
                onClick={() => setTopicModalOpen(false)}
                aria-label="닫기"
                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-muted hover:text-fg hover:border-primary transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 pb-3">
              <input
                value={topicQuery}
                onChange={(event) => setTopicQuery(event.target.value)}
                placeholder="토픽 검색 (예: 백엔드, 인프라)"
                className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="px-5 pb-5 overflow-y-auto">
              {filteredTopics.length === 0 ? (
                <p className="text-sm text-muted m-0 py-6 text-center">검색 결과가 없어요.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {filteredTopics.map((topic) => {
                    const total = topic.keywords.length;
                    const selectedCount = topic.keywords.filter((keyword) => selected.has(keyword.id)).length;
                    const allSelected = total > 0 && selectedCount === total;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => onToggleTopic(topic)}
                        disabled={total === 0}
                        aria-pressed={allSelected}
                        className={`text-left rounded-xl border p-3 transition-colors disabled:opacity-40 ${
                          allSelected
                            ? "bg-primary-soft border-primary"
                            : "bg-card border-border hover:border-primary"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                          <span className={`text-sm font-bold leading-snug ${allSelected ? "text-primary" : "text-fg"}`}>
                            {topic.name}
                          </span>
                          <span className={`shrink-0 text-xs font-semibold ${allSelected ? "text-primary" : "text-muted"}`}>
                            {allSelected ? "✓" : selectedCount > 0 ? `${selectedCount}/${total}` : `${total}`}
                          </span>
                        </div>
                        <p className="text-xs text-muted m-0 font-mono truncate">
                          {topic.keywords.slice(0, 3).map((keyword) => keyword.name).join(", ") || "키워드 없음"}
                          {total > 3 ? " …" : ""}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border">
              <button
                type="button"
                onClick={() => setTopicModalOpen(false)}
                className="w-full bg-primary text-primary-fg py-3 rounded-xl font-extrabold text-sm hover:opacity-90 transition-opacity"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm font-semibold text-muted mt-6 mb-2">추가 키워드는 검색해서 추가하세요</p>
      <div className="relative">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="키워드 검색 (예: redis, kafka, react)"
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-primary"
        />
        {query.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 z-10 bg-card border border-border rounded-xl p-3 max-h-[280px] overflow-y-auto shadow-lg">
            {results.length === 0 ? (
              <p className="text-sm text-muted m-0">검색 결과가 없어요.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {results.map((keyword) => {
                  const active = selected.has(keyword.id);
                  return (
                    <button
                      key={keyword.id}
                      onClick={() => {
                        onToggleKeyword(keyword.id, keyword.name);
                        setQuery("");
                      }}
                      className={`font-mono text-sm px-3.5 py-2 rounded-lg border transition-colors ${
                        active
                          ? "bg-primary text-primary-fg border-primary"
                          : "bg-card text-fg border-border hover:border-primary hover:text-primary"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {keyword.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
