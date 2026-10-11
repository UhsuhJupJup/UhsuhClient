"use client";

import Link from "next/link";
import type { RelatedKeyword } from "@/lib/types";
import { formatCount, formatDate } from "@/lib/format";
import { DetailBadge } from "@/components/DetailBadge";
import { SubscribeCta } from "@/components/SubscribeCta";
import { RelatedKeywordList } from "@/components/keyword/RelatedKeywordList";
import type { KeywordSummary, SummaryPart } from "@/components/keyword/useKeywordSummaries";

const headingClass = "m-0 mb-2 text-[15px] font-extrabold tracking-[-0.01em]";
const noticeClass = "m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-muted";
const retryClass =
  "rounded-lg border border-border bg-card px-2.5 py-1 text-[13px] font-semibold text-fg cursor-pointer transition-colors hover:border-primary hover:text-primary";

export function KeywordSummaryPanel({
  keywordId,
  keywordName,
  summary,
  onPick,
  onRetry,
}: {
  keywordId: number;
  keywordName: string;
  summary: KeywordSummary | undefined;
  onPick: (id: number, name: string) => void;
  onRetry: (part: SummaryPart, id: number) => void;
}) {
  const detail = summary?.detail;
  const articles = summary?.articles;
  const loading = !detail || !articles;
  const articleCount = detail?.status === "ready" ? detail.data.articleCount : undefined;
  const relatedKeywords = detail?.status === "ready" ? (detail.data.relatedKeywords ?? []) : [];
  const recentArticles = articles?.status === "ready" ? articles.data : [];

  return (
    <aside
      aria-label="고른 키워드 요약"
      className="grid min-w-0 gap-[18px] rounded-2xl border border-border bg-card p-5"
    >
      <div className="grid min-w-0 justify-items-start gap-1.5">
        <DetailBadge label="키워드" />
        <p className="m-0 font-mono text-[26px] font-extrabold leading-[1.2] tracking-[-0.025em] [overflow-wrap:anywhere]">
          {keywordName}
        </p>
        {articleCount !== undefined && (
          <p className="m-0 text-[14.5px] text-muted">
            주워온 글{" "}
            <b className="font-mono text-xl font-extrabold text-fg tabular-nums">
              {formatCount(articleCount)}
            </b>
            개
          </p>
        )}
      </div>

      <div>
        <SubscribeCta label="+ 이 키워드 구독" />
      </div>

      {loading && (
        <p role="status" className={noticeClass}>
          요약을 불러오는 중…
        </p>
      )}

      {detail?.status === "error" && (
        <p role="alert" className={noticeClass}>
          키워드 요약을 불러오지 못했어요.
          <button type="button" onClick={() => onRetry("detail", keywordId)} className={retryClass}>
            다시 시도
          </button>
        </p>
      )}

      {relatedKeywords.length > 0 && (
        <div className="min-w-0">
          <h3 className={headingClass}>함께 자주 나온 키워드</h3>
          <RelatedKeywordList
            keywords={relatedKeywords}
            dense
            onSelect={(keyword: RelatedKeyword) => onPick(keyword.id, keyword.name)}
          />
        </div>
      )}

      {articles?.status === "error" && (
        <p role="alert" className={noticeClass}>
          최근 글을 불러오지 못했어요.
          <button type="button" onClick={() => onRetry("articles", keywordId)} className={retryClass}>
            다시 시도
          </button>
        </p>
      )}

      {recentArticles.length > 0 && (
        <div className="min-w-0">
          <h3 className={headingClass}>최근 글</h3>
          <ul className="m-0 grid list-none gap-2.5 p-0">
            {recentArticles.map((article) => (
              <li
                key={article.id}
                className="grid gap-0.5 border-b border-border pb-2.5 last:border-b-0 last:pb-0"
              >
                <span className="text-xs text-muted tabular-nums">
                  {article.blog.name}, {formatDate(article.publishedAt)}
                </span>
                <Link
                  href={`/article/${article.id}`}
                  className="text-sm font-semibold leading-[1.45] text-fg no-underline transition-colors hover:text-primary [overflow-wrap:anywhere]"
                >
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/keyword/${keywordId}`}
        className="justify-self-start text-[13.5px] font-bold text-primary no-underline hover:underline"
      >
        키워드 화면에서 모두 보기 →
      </Link>
    </aside>
  );
}
