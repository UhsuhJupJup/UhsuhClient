"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getTopics } from "@/lib/api/topics";
import { searchKeywords } from "@/lib/api/keywords";
import {
  agreeConsent,
  getSubscriptions,
  replaceSubscriptions,
  unsubscribeAll,
} from "@/lib/api/subscriptions";
import { ApiError } from "@/lib/api/client";
import type { Keyword, Topic } from "@/lib/types";
import { BackLink } from "@/components/BackLink";

export function SubscriptionEditor({ mode = "create" }: { mode?: "create" | "edit" }) {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const isEdit = mode === "edit";

  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Map<number, string>>(new Map());
  const [selectedKeywords, setSelectedKeywords] = useState<Map<number, string>>(new Map());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Keyword[]>([]);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialTopicIds = useRef<Set<number>>(new Set());
  const initialKeywordIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getIdToken();
        const [topics, subs] = await Promise.all([
          getTopics(),
          token ? getSubscriptions(token) : Promise.resolve({ topics: [], keywords: [] }),
        ]);
        if (!active) return;
        setAllTopics(topics);
        setSelectedTopics(new Map(subs.topics.map((topic) => [topic.id, topic.name])));
        setSelectedKeywords(new Map(subs.keywords.map((keyword) => [keyword.id, keyword.name])));
        initialTopicIds.current = new Set(subs.topics.map((topic) => topic.id));
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

  const toggleTopic = useCallback((topic: Topic) => {
    setSelectedTopics((prev) => {
      const next = new Map(prev);
      if (next.has(topic.id)) next.delete(topic.id);
      else next.set(topic.id, topic.name);
      return next;
    });
  }, []);

  const toggleKeyword = useCallback((id: number, name: string) => {
    setSelectedKeywords((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, name);
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
      await replaceSubscriptions(token, [...selectedTopics.keys()], [...selectedKeywords.keys()]);
      router.push("/manage");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) {
        setError("메일 수신 동의가 필요해요. 아래 동의에 체크해 주세요.");
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

  const selectedCount = selectedTopics.size + selectedKeywords.size;
  const isDirty =
    !sameIds(selectedTopics, initialTopicIds.current) ||
    !sameIds(selectedKeywords, initialKeywordIds.current);

  if (loading) {
    return <p className="text-muted py-20 text-center">불러오는 중…</p>;
  }

  return (
    <div>
      <BackLink
        href={isEdit ? "/manage" : "/explore"}
        label={isEdit ? "← 구독 관리로" : "← 탐색으로"}
      />
      <h1 className="text-[36px] font-extrabold tracking-[-0.025em] m-0">
        {isEdit ? "구독 수정" : "구독 설정"}
      </h1>
      <p className="text-base text-muted mt-2 mb-8">
        {isEdit
          ? "구독 중인 토픽, 키워드를 바꾸고 저장하세요."
          : "관심 토픽, 키워드를 담고 받을 메일만 확인하면 끝이에요."}
      </p>

      <div className="bg-surface border border-border rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-3.5">
          <span className="text-sm font-bold">담은 항목</span>
          <span className="font-mono text-xs text-muted">{selectedCount}</span>
        </div>
        {selectedCount === 0 ? (
          <p className="text-sm text-muted m-0">아래에서 토픽이나 키워드를 눌러 담아주세요.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[...selectedTopics].map(([id, name]) => (
              <span key={`t-${id}`} className="inline-flex items-center gap-1.5 bg-primary-soft text-primary text-sm px-3 py-1.5 rounded-lg">
                {name}
                <button onClick={() => toggleTopic({ id, name })} aria-label="제거" className="text-primary/70 hover:text-danger">×</button>
              </span>
            ))}
            {[...selectedKeywords].map(([id, name]) => (
              <span key={`k-${id}`} className="inline-flex items-center gap-1.5 bg-primary-soft text-primary font-mono text-sm px-3 py-1.5 rounded-lg">
                {name}
                <button onClick={() => toggleKeyword(id, name)} aria-label="제거" className="hover:text-danger">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Step number={1} title="받을 메일">
        <input
          value={user?.email ?? ""}
          readOnly
          className="w-full bg-chip-bg border border-border rounded-xl px-4 py-3 text-base text-muted"
        />
        <p className="text-sm text-muted mt-2">로그인한 계정 메일로 보내드려요.</p>
      </Step>

      <Step number={2} title="관심 토픽, 키워드 선택">
        <p className="text-sm font-semibold text-muted mt-1 mb-2">토픽</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {allTopics.map((topic) => {
            const active = selectedTopics.has(topic.id);
            return (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic)}
                className={`text-sm px-3.5 py-2 rounded-lg border transition-colors ${
                  active
                    ? "bg-primary text-primary-fg border-primary"
                    : "bg-card text-fg border-border hover:border-primary hover:text-primary"
                }`}
              >
                {active ? "✓ " : ""}
                {topic.name}
              </button>
            );
          })}
        </div>

        <p className="text-sm font-semibold text-muted mb-2">키워드</p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="키워드 검색 (예: redis, kafka)"
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-primary mb-3"
        />
        <div className="flex flex-wrap gap-2">
          {results.map((keyword) => {
            const active = selectedKeywords.has(keyword.id);
            return (
              <button
                key={keyword.id}
                onClick={() => toggleKeyword(keyword.id, keyword.name)}
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
      </Step>

      {!isEdit && (
        <label className="flex items-start gap-2.5 mt-8 mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 accent-[var(--primary)]"
          />
          <span className="text-sm text-muted leading-relaxed">
            서비스 이용약관과 메일 수신에 동의합니다. 발송되는 모든 메일 하단의 링크 또는 &lsquo;구독 관리&rsquo;에서 언제든 해지할 수 있습니다.
          </span>
        </label>
      )}

      {error && <p className="text-sm text-danger mb-4 mt-8">{error}</p>}

      <button
        onClick={submit}
        disabled={(!isEdit && !consent) || !isDirty || saving}
        className={`w-full bg-primary text-primary-fg py-4 rounded-xl font-extrabold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${isEdit ? "mt-8" : ""}`}
      >
        {saving ? "저장 중…" : isEdit ? "수정하기" : "줍줍하기"}
      </button>

      {isEdit && (
        <button
          onClick={handleUnsubscribeAll}
          disabled={saving}
          className="w-full mt-3 py-3 text-sm font-semibold text-muted hover:text-danger transition-colors disabled:opacity-60"
        >
          전체 구독 해지
        </button>
      )}
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
