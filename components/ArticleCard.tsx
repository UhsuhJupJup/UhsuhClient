import Link from "next/link";
import type { ArticleCardData } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function ArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <article className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all">
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-chip-bg text-fg font-bold text-[11px]">
          {article.blog.name.charAt(0)}
        </span>
        <span className="font-medium text-fg">{article.blog.name}</span>
        <span aria-hidden>·</span>
        <span>{formatDate(article.publishedAt)}</span>
      </div>

      <Link
        href={`/article/${article.id}`}
        className="text-lg font-bold leading-snug text-fg no-underline hover:text-primary transition-colors"
      >
        {article.title}
      </Link>

      {article.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {article.keywords.map((keyword) => (
            <span
              key={keyword}
              className="font-mono text-xs text-muted bg-chip-bg px-2 py-1 rounded-md"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary no-underline hover:opacity-90 mt-1"
      >
        원문 보기 ↗
      </a>
    </article>
  );
}
