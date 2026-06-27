"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getSubscriptions, type Subscriptions } from "@/lib/api/subscriptions";
import { LoginPanel } from "@/components/auth/LoginPanel";

export default function ManagePage() {
  const { user, loading, getIdToken } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscriptions | null>(null);

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    setSubscriptions(await getSubscriptions(token));
  }, [getIdToken]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading) {
    return <main className="max-w-[760px] mx-auto px-6 py-24 text-center text-muted">불러오는 중…</main>;
  }

  if (!user) {
    return (
      <main className="max-w-[460px] mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-[22px] p-9">
          <LoginPanel />
        </div>
      </main>
    );
  }

  const topics = subscriptions?.topics ?? [];
  const keywords = subscriptions?.keywords ?? [];
  const hasSubscriptions = topics.length > 0 || keywords.length > 0;
  const isEmpty = subscriptions !== null && !hasSubscriptions;

  return (
    <main className="max-w-[760px] mx-auto px-6 py-12">
      <h1 className="text-[36px] font-extrabold tracking-[-0.025em] m-0">구독 관리</h1>
      <p className="text-base text-muted mt-2 mb-8">구독 중인 항목을 확인하고 관리하세요.</p>

      <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 mb-8">
        <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-primary-soft text-primary font-extrabold">
          {(user.email ?? "?").charAt(0).toUpperCase()}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-bold">받을 메일</span>
          <span className="font-mono text-sm text-muted">{user.email}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold m-0">구독 중인 항목</h2>
        {hasSubscriptions && (
          <Link
            href="/manage/edit"
            className="inline-flex items-center bg-primary text-primary-fg px-4 py-2 rounded-[9px] font-bold text-sm no-underline hover:opacity-90 transition-opacity"
          >
            관리
          </Link>
        )}
      </div>

      {subscriptions === null ? (
        <p className="text-muted">불러오는 중…</p>
      ) : isEmpty ? (
        <div className="flex flex-col items-center text-center gap-2 py-16">
          <p className="text-sm text-muted m-0">아직 구독 중인 항목이 없어요.</p>
          <Link href="/subscribe" className="text-sm font-semibold text-primary no-underline">
            토픽, 키워드 담으러 가기 →
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <Link
              key={`t-${topic.id}`}
              href={`/topic/${topic.id}`}
              className="inline-flex items-center gap-1.5 bg-card border border-border text-sm px-3.5 py-2 rounded-lg no-underline text-fg hover:border-primary hover:text-primary transition-colors"
            >
              <span className="text-xs text-muted">토픽</span>
              {topic.name}
            </Link>
          ))}
          {keywords.map((keyword) => (
            <Link
              key={`k-${keyword.id}`}
              href={`/keyword/${keyword.id}`}
              className="inline-flex items-center gap-1.5 bg-card border border-border font-mono text-sm px-3.5 py-2 rounded-lg no-underline text-fg hover:border-primary hover:text-primary transition-colors"
            >
              <span className="font-sans text-xs text-muted">키워드</span>
              {keyword.name}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
