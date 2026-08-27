"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getSubscriptions } from "@/lib/api/subscriptions";
import { getArticles } from "@/lib/api/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { LoginPanel } from "@/components/auth/LoginPanel";
import type { ArticlePage } from "@/lib/types";

const PAGE_SIZE = 10;

export function SubscribedArticles() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const [keywordIds, setKeywordIds] = useState<number[] | null>(null);
  const [articlePage, setArticlePage] = useState<ArticlePage | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setKeywordIds(null);
      return;
    }
    let active = true;
    setError(null);
    getIdToken()
      .then((token) => {
        if (!token) throw new Error("no token");
        return getSubscriptions(token);
      })
      .then((subscriptions) => {
        if (active) setKeywordIds(subscriptions.keywords.map((keyword) => keyword.id));
      })
      .catch(() => {
        if (active) setError("구독 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      });
    return () => {
      active = false;
    };
  }, [user, getIdToken]);

  useEffect(() => {
    if (!keywordIds || keywordIds.length === 0) {
      setArticlePage(null);
      return;
    }
    let active = true;
    setLoading(true);
    getArticles({ keywordIds, page, size: PAGE_SIZE })
      .then((result) => {
        if (active) setArticlePage(result);
      })
      .catch(() => {
        if (active) setError("글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [keywordIds, page]);

  const goToPage = useCallback((target: number) => {
    setPage(target);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (authLoading) {
    return <p className="text-sm text-muted mt-8">불러오는 중…</p>;
  }

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 mt-8 max-w-[480px] mx-auto">
        <p className="text-center text-sm text-muted mb-6">
          로그인하면 구독한 키워드의 글만 모아 봐요.
        </p>
        <LoginPanel />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-danger mt-8">{error}</p>;
  }

  if (keywordIds === null) {
    return <p className="text-sm text-muted mt-8">불러오는 중…</p>;
  }

  if (keywordIds.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-20">
        <h3 className="text-lg font-bold text-fg m-0">구독한 키워드가 없어요</h3>
        <p className="text-sm text-muted m-0">키워드를 구독하면 새 글을 여기 모아드려요.</p>
        <Link
          href="/subscribe"
          className="mt-2 inline-flex items-center gap-2 bg-primary text-primary-fg px-5 py-2.5 rounded-lg font-semibold text-sm no-underline hover:opacity-90 transition-opacity"
        >
          키워드 구독하러 가기 →
        </Link>
      </div>
    );
  }

  if (loading && !articlePage) {
    return <p className="text-sm text-muted mt-8">불러오는 중…</p>;
  }

  const articles = articlePage?.content ?? [];

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-2 py-20">
        <h3 className="text-lg font-bold text-fg m-0">아직 구독한 키워드의 글이 없어요</h3>
        <p className="text-sm text-muted m-0">새 글이 줍줍되면 여기 모여요.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} bookmarkable />
        ))}
      </div>
      {articlePage && (
        <Pagination
          currentPage={articlePage.page}
          totalPages={articlePage.totalPages}
          hrefForPage={(target) => `#page-${target}`}
          onNavigate={goToPage}
        />
      )}
    </>
  );
}
