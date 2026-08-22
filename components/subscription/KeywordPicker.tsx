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

  const topicFilter = topicQuery.trim().toLowerCase();
  const filteredTopics = topicFilter
    ? allTopics.filter((topic) => topic.name.toLowerCase().includes(topicFilter))
    : allTopics;

  return (
    <>
      <p className="text-sm font-semibold text-muted mb-1">키워드 묶음으로 구독하세요</p>
      <p className="text-xs text-muted mb-2">토픽을 누르면 그 토픽의 키워드가 한 번에 담겨요.</p>
      <input
        value={topicQuery}
        onChange={(event) => setTopicQuery(event.target.value)}
        placeholder="토픽 검색 (예: 백엔드, 인프라)"
        className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary mb-3"
      />
      {loading ? (
        <p className="text-sm text-muted m-0">불러오는 중…</p>
      ) : filteredTopics.length === 0 ? (
        <p className="text-sm text-muted m-0">검색 결과가 없어요.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {filteredTopics.map((topic) => {
            const total = topic.keywords.length;
            const selectedCount = topic.keywords.filter((keyword) => selected.has(keyword.id)).length;
            const allSelected = total > 0 && selectedCount === total;
            const sample = topic.keywords
              .slice(0, 3)
              .map((keyword) => keyword.name)
              .join(", ");
            return (
              <button
                key={topic.id}
                onClick={() => onToggleTopic(topic)}
                disabled={total === 0}
                className={`snap-start shrink-0 w-[180px] text-left rounded-xl border p-3 transition-colors disabled:opacity-40 ${
                  allSelected
                    ? "bg-primary-soft border-primary"
                    : "bg-card border-border hover:border-primary"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-sm font-bold truncate ${allSelected ? "text-primary" : "text-fg"}`}>
                    {topic.name}
                  </span>
                  <span className={`shrink-0 text-xs font-semibold ${allSelected ? "text-primary" : "text-muted"}`}>
                    {allSelected ? "✓ 담김" : selectedCount > 0 ? `${selectedCount}/${total}` : `${total}개`}
                  </span>
                </div>
                <p className="text-xs text-muted m-0 truncate font-mono">
                  {sample || "키워드 없음"}
                  {total > 3 ? " …" : ""}
                </p>
              </button>
            );
          })}
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
