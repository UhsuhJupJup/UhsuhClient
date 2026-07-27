"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { ArticleCard } from "@/components/ArticleCard";
import { getBookmarks, getNotifications } from "@/lib/api/archive";
import { PageHeader } from "@/components/PageHeader";
import type { ArticleCardData } from "@/lib/types";

type TabKey = "sent" | "star";

type Loadable =
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "ready"; articles: ArticleCardData[] };

const tabBase = "px-3.5 py-2 rounded-lg font-semibold text-sm transition-colors";

export default function ArchivePage() {
  const { user, loading, getIdToken } = useAuth();
  const [tab, setTab] = useState<TabKey>("sent");
  const [sent, setSent] = useState<Loadable>({ phase: "loading" });
  const [star, setStar] = useState<Loadable>({ phase: "loading" });

  const loadSent = useCallback(async () => {
    setSent({ phase: "loading" });
    try {
      const token = await getIdToken();
      if (!token) {
        setSent({ phase: "error" });
        return;
      }
      const page = await getNotifications(token);
      setSent({ phase: "ready", articles: page.content.map((item) => item.article) });
    } catch {
      setSent({ phase: "error" });
    }
  }, [getIdToken]);

  const loadStar = useCallback(async () => {
    setStar({ phase: "loading" });
    try {
      const token = await getIdToken();
      if (!token) {
        setStar({ phase: "error" });
        return;
      }
      const page = await getBookmarks(token);
      setStar({ phase: "ready", articles: page.content.map((item) => item.article) });
    } catch {
      setStar({ phase: "error" });
    }
  }, [getIdToken]);

  useEffect(() => {
    if (!user) return;
    if (tab === "sent") loadSent();
    else loadStar();
  }, [user, tab, loadSent, loadStar]);

  if (loading) {
    return (
      <main className="max-w-[760px] mx-auto px-6 py-24 text-center text-muted">불러오는 중…</main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-[460px] mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-[22px] p-9">
          <LoginPanel />
          <p className="text-center text-sm text-muted mt-6">
            먼저 둘러볼까요?{" "}
            <Link href="/explore" className="text-primary font-semibold no-underline">
              토픽 탐색하기 →
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const active = tab === "sent" ? sent : star;

  return (
    <main className="max-w-[760px] mx-auto px-6 py-12">
      <PageHeader
        eyebrow="Library"
        title="보관함"
        description="보낸 글과 저장한 글을 다시 찾아볼 수 있어요."
      />

      <div className="flex gap-1.5 mb-8">
        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`${tabBase} ${
            tab === "sent" ? "bg-primary text-primary-fg" : "text-muted hover:text-fg hover:bg-chip-bg"
          }`}
        >
          보낸 글
        </button>
        <button
          type="button"
          onClick={() => setTab("star")}
          className={`${tabBase} ${
            tab === "star" ? "bg-primary text-primary-fg" : "text-muted hover:text-fg hover:bg-chip-bg"
          }`}
        >
          저장
        </button>
      </div>

      {active.phase === "loading" ? (
        <ArchiveSkeleton />
      ) : active.phase === "error" ? (
        <ArchiveError onRetry={tab === "sent" ? loadSent : loadStar} />
      ) : active.articles.length === 0 ? (
        tab === "sent" ? (
          <ArchiveEmpty
            title="보낸 글이 없어요"
            body="키워드를 구독하면 맞는 글을 주워서 보관해드려요."
            ctaHref="/subscribe"
            ctaLabel="구독하러 가기 →"
          />
        ) : (
          <ArchiveEmpty
            title="저장한 글이 없어요"
            body="글에서 저장 아이콘을 눌러 따로 모아보세요."
            ctaHref="/explore"
            ctaLabel="글 둘러보기 →"
          />
        )
      ) : (
        <div className="flex flex-col gap-4">
          {active.articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              bookmarkable
              initialBookmarked={tab === "star"}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function ArchiveSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3"
        >
          <div className="h-4 w-40 bg-skeleton rounded animate-pulse" />
          <div className="h-6 w-3/4 bg-skeleton rounded animate-pulse" />
          <div className="flex gap-1.5">
            <div className="h-6 w-16 bg-skeleton rounded-md animate-pulse" />
            <div className="h-6 w-20 bg-skeleton rounded-md animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ArchiveError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-16">
      <p className="text-sm text-muted m-0">불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center bg-primary text-primary-fg px-4 py-2 rounded-[9px] font-bold text-sm hover:opacity-90 transition-opacity"
      >
        다시 시도
      </button>
    </div>
  );
}

function ArchiveEmpty({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-16">
      <h3 className="text-lg font-bold text-fg m-0">{title}</h3>
      <p className="text-sm text-muted m-0">{body}</p>
      <Link href={ctaHref} className="text-sm font-semibold text-primary no-underline mt-1">
        {ctaLabel}
      </Link>
    </div>
  );
}
