"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getKeyword, searchKeywords } from "@/lib/api/keywords";
import type { Keyword } from "@/lib/types";

function parseIds(value: string | null): number[] {
  if (!value) return [];
  return value.split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0);
}

export function KeywordFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keywordIds = parseIds(searchParams.get("keywordIds"));
  const keywordIdsKey = keywordIds.join(",");

  const [names, setNames] = useState<Map<number, string>>(new Map());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Keyword[]>([]);

  useEffect(() => {
    if (!keywordIdsKey) {
      setNames(new Map());
      return;
    }
    let active = true;
    Promise.all(
      keywordIdsKey.split(",").map((id) =>
        getKeyword(Number(id))
          .then((keyword) => [keyword.id, keyword.name] as const)
          .catch(() => null),
      ),
    ).then((pairs) => {
      if (!active) return;
      setNames(new Map(pairs.filter((pair): pair is readonly [number, string] => pair !== null)));
    });
    return () => {
      active = false;
    };
  }, [keywordIdsKey]);

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

  const navigate = useCallback(
    (ids: number[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "keyword");
      if (ids.length) params.set("keywordIds", ids.join(","));
      else params.delete("keywordIds");
      params.delete("page");
      router.push(`/explore?${params.toString()}`);
    },
    [router, searchParams],
  );

  function addKeyword(keyword: Keyword) {
    setNames((prev) => new Map(prev).set(keyword.id, keyword.name));
    setQuery("");
    if (!keywordIds.includes(keyword.id)) navigate([...keywordIds, keyword.id]);
  }

  return (
    <div className="mt-4">
      {keywordIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {keywordIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 bg-primary text-primary-fg font-mono text-sm px-3 py-1.5 rounded-lg"
            >
              {names.get(id) ?? "…"}
              <button
                onClick={() => navigate(keywordIds.filter((x) => x !== id))}
                aria-label="제거"
                className="hover:opacity-70"
              >
                ×
              </button>
            </span>
          ))}
          <button onClick={() => navigate([])} className="text-xs font-semibold text-primary">
            전체 해제
          </button>
        </div>
      )}

      <div className="relative max-w-[420px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="키워드 검색해서 추가 (예: redis, kafka)"
          className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        {query.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 z-10 bg-card border border-border rounded-xl p-3 max-h-[240px] overflow-y-auto shadow-lg">
            {results.length === 0 ? (
              <p className="text-sm text-muted m-0">검색 결과가 없어요.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {results.map((keyword) => {
                  const active = keywordIds.includes(keyword.id);
                  return (
                    <button
                      key={keyword.id}
                      onClick={() => addKeyword(keyword)}
                      className={`font-mono text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                        active
                          ? "bg-primary text-primary-fg border-primary"
                          : "bg-card text-fg border-border hover:border-primary hover:text-primary"
                      }`}
                    >
                      {active ? "✓ " : "+ "}
                      {keyword.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {keywordIds.length === 0 && (
        <p className="text-xs text-muted mt-2">
          키워드를 검색해 추가하면 해당 글을 모아 보여줘요. 여러 개도 가능해요.
        </p>
      )}
    </div>
  );
}
