"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getTopicsWithKeywords } from "@/lib/api/topics";
import { searchKeywords } from "@/lib/api/keywords";
import {
  agreeConsent,
  getSubscriptions,
  replaceSubscriptions,
  unsubscribeAll,
} from "@/lib/api/subscriptions";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/PageHeader";
import type { Keyword, TopicDetail } from "@/lib/types";
import { BackLink } from "@/components/BackLink";

export function SubscriptionEditor({ mode = "create" }: { mode?: "create" | "edit" }) {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const isEdit = mode === "edit";

  const [allTopics, setAllTopics] = useState<TopicDetail[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Map<number, string>>(new Map());
  const [query, setQuery] = useState("");
  const [topicQuery, setTopicQuery] = useState("");
  const [results, setResults] = useState<Keyword[]>([]);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialKeywordIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getIdToken();
        const [topics, subs] = await Promise.all([
          getTopicsWithKeywords(),
          token ? getSubscriptions(token) : Promise.resolve({ topics: [], keywords: [] }),
        ]);
        if (!active) return;
        setAllTopics(topics);
        setSelectedKeywords(new Map(subs.keywords.map((keyword) => [keyword.id, keyword.name])));
        initialKeywordIds.current = new Set(subs.keywords.map((keyword) => keyword.id));
      } catch {
        if (active) setError("구독 정보를 불러오지 못했어요.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [getIdToken]);

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

  const toggleKeyword = useCallback((id: number, name: string) => {
    setSelectedKeywords((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, name);
      return next;
    });
  }, []);

  const toggleAllTopicKeywords = useCallback((topic: TopicDetail) => {
    setSelectedKeywords((prev) => {
      const next = new Map(prev);
      const allSelected = topic.keywords.length > 0 && topic.keywords.every((keyword) => next.has(keyword.id));
      if (allSelected) {
        topic.keywords.forEach((keyword) => next.delete(keyword.id));
      } else {
        topic.keywords.forEach((keyword) => next.set(keyword.id, keyword.name));
      }
      return next;
    });
  }, []);

  async function submit() {
    if (!isDirty) {
      router.push("/manage");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("missing token");
      if (!isEdit && consent) await agreeConsent(token);
      await replaceSubscriptions(token, [...selectedKeywords.keys()]);
      router.push("/manage");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) {
        setError("메일 수신 동의가 필요해요. 옆의 동의에 체크해 주세요.");
      } else {
        setError("저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
      setSaving(false);
    }
  }

  async function handleUnsubscribeAll() {
    if (!confirm("모든 구독을 해지할까요?")) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("missing token");
      await unsubscribeAll(token);
      router.push("/manage");
    } catch {
      setError("해지에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setSaving(false);
    }
  }

  const selectedCount = selectedKeywords.size;
  const topicFilter = topicQuery.trim().toLowerCase();
  const filteredTopics = topicFilter
    ? allTopics.filter((topic) => topic.name.toLowerCase().includes(topicFilter))
    : allTopics;
  const isDirty = !sameIds(selectedKeywords, initialKeywordIds.current);

  if (loading) {
    return <p className="text-muted py-20 text-center">불러오는 중…</p>;
  }

  return (
    <div>
      <BackLink
        href={isEdit ? "/manage" : "/explore"}
        label={isEdit ? "← 구독 관리로" : "← 탐색으로"}
      />
      <PageHeader
        eyebrow="Subscribe"
        title={isEdit ? "구독 수정" : "구독 설정"}
        description={
          isEdit
            ? "구독 중인 키워드를 바꾸고 저장하세요."
            : "관심 키워드를 담고 받을 메일만 확인하면 끝이에요."
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="min-w-0">
          <Step number={1} title="받을 메일">
            <input
              value={user?.email ?? ""}
              readOnly
              className="w-full bg-chip-bg border border-border rounded-xl px-4 py-3 text-base text-muted"
            />
            <p className="text-sm text-muted mt-2">로그인한 계정 메일로 보내드려요.</p>
          </Step>

          <Step number={2} title="관심 키워드 선택">
            <p className="text-sm font-semibold text-muted mb-1">키워드 묶음으로 구독하세요</p>
            <p className="text-xs text-muted mb-2">토픽을 누르면 그 토픽의 키워드가 한 번에 담겨요.</p>
            <input
              value={topicQuery}
              onChange={(event) => setTopicQuery(event.target.value)}
              placeholder="토픽 검색 (예: 백엔드, 인프라)"
              className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary mb-3"
            />
            {filteredTopics.length === 0 ? (
              <p className="text-sm text-muted m-0">검색 결과가 없어요.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
                {filteredTopics.map((topic) => {
                  const total = topic.keywords.length;
                  const selected = topic.keywords.filter((keyword) => selectedKeywords.has(keyword.id)).length;
                  const allSelected = total > 0 && selected === total;
                  const sample = topic.keywords.slice(0, 3).map((keyword) => keyword.name).join(", ");
                  return (
                    <button
                      key={topic.id}
                      onClick={() => toggleAllTopicKeywords(topic)}
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
                          {allSelected ? "✓ 담김" : selected > 0 ? `${selected}/${total}` : `${total}개`}
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
                        const active = selectedKeywords.has(keyword.id);
                        return (
                          <button
                            key={keyword.id}
                            onClick={() => {
                              toggleKeyword(keyword.id, keyword.name);
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
          </Step>
        </div>

        <aside className="lg:sticky lg:top-20">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold m-0">담은 키워드</h3>
              <span className="font-mono text-xs text-muted">{selectedCount}</span>
            </div>
            {selectedCount === 0 ? (
              <p className="text-sm text-muted m-0">토픽을 누르거나 검색해서 담아주세요.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[320px] overflow-y-auto">
                {[...selectedKeywords].map(([id, name]) => (
                  <span key={`k-${id}`} className="inline-flex items-center gap-1.5 bg-primary-soft text-primary font-mono text-sm px-3 py-1.5 rounded-lg">
                    {name}
                    <button onClick={() => toggleKeyword(id, name)} aria-label="제거" className="hover:text-danger">×</button>
                  </span>
                ))}
              </div>
            )}

            {!isEdit && (
              <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-0.5 accent-[var(--primary)]"
                />
                <span className="text-xs text-muted leading-relaxed">
                  서비스 이용약관과 메일 수신에 동의합니다. 메일 하단 링크나 &lsquo;구독 관리&rsquo;에서 언제든 해지할 수 있어요.
                </span>
              </label>
            )}

            {error && <p className="text-sm text-danger mt-4">{error}</p>}

            <button
              onClick={submit}
              disabled={(!isEdit && !consent) || !isDirty || saving}
              className="w-full mt-5 bg-primary text-primary-fg py-3.5 rounded-xl font-extrabold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "저장 중…" : isEdit ? "수정하기" : "줍줍하기"}
            </button>

            {isEdit && (
              <button
                onClick={handleUnsubscribeAll}
                disabled={saving}
                className="w-full mt-2 py-2.5 text-sm font-semibold text-muted hover:text-danger transition-colors disabled:opacity-60"
              >
                전체 구독 해지
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function sameIds(selected: Map<number, string>, initial: Set<number>): boolean {
  if (selected.size !== initial.size) return false;
  for (const id of selected.keys()) {
    if (!initial.has(id)) return false;
  }
  return true;
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-primary text-primary-fg font-bold text-xs">
          {number}
        </span>
        <h2 className="text-lg font-bold m-0">{title}</h2>
      </div>
      {children}
    </div>
  );
}
