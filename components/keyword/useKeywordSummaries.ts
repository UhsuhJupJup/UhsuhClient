"use client";

import { useCallback, useRef, useState } from "react";
import { getKeyword } from "@/lib/api/keywords";
import { getArticles } from "@/lib/api/articles";
import type { ArticleCardData, KeywordDetail } from "@/lib/types";

export type Loadable<T> = { status: "ready"; data: T } | { status: "error" };

export interface KeywordSummary {
  detail?: Loadable<KeywordDetail>;
  articles?: Loadable<ArticleCardData[]>;
}

export type SummaryPart = keyof KeywordSummary;

const RECENT_ARTICLE_COUNT = 3;

function withPart(
  summaries: ReadonlyMap<number, KeywordSummary>,
  id: number,
  patch: KeywordSummary,
): ReadonlyMap<number, KeywordSummary> {
  const next = new Map(summaries);
  next.set(id, { ...summaries.get(id), ...patch });
  return next;
}

export function useKeywordSummaries() {
  const [summaries, setSummaries] = useState<ReadonlyMap<number, KeywordSummary>>(() => new Map());
  const startedRef = useRef(new Set<string>());

  const request = useCallback((part: SummaryPart, id: number) => {
    const key = `${part}:${id}`;
    const started = startedRef.current;
    if (started.has(key)) return;
    started.add(key);
    const fail = () => {
      started.delete(key);
      setSummaries((prev) => withPart(prev, id, { [part]: { status: "error" } }));
    };
    if (part === "detail") {
      getKeyword(id).then(
        (data) => setSummaries((prev) => withPart(prev, id, { detail: { status: "ready", data } })),
        fail,
      );
      return;
    }
    getArticles({ keywordIds: [id], size: RECENT_ARTICLE_COUNT }).then(
      (page) =>
        setSummaries((prev) => withPart(prev, id, { articles: { status: "ready", data: page.content } })),
      fail,
    );
  }, []);

  const loadSummary = useCallback(
    (id: number) => {
      request("detail", id);
      request("articles", id);
    },
    [request],
  );

  const retrySummary = useCallback(
    (part: SummaryPart, id: number) => {
      setSummaries((prev) => withPart(prev, id, { [part]: undefined }));
      request(part, id);
    },
    [request],
  );

  return { summaries, loadSummary, retrySummary };
}
