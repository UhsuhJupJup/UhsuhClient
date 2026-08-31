import Link from "next/link";
import type { ArticleCardData } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { BookmarkButton } from "@/components/BookmarkButton";
import { BlogLogo } from "@/components/BlogLogo";

export function ArticleCard({
  article,
  bookmarkable = false,
  initialBookmarked = false,
}: {
  article: ArticleCardData;
  bookmarkable?: boolean;
  initialBookmarked?: boolean;
}) {
  return (
    <article className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all">
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <BlogLogo name={article.blog.name} domain={article.blog.domain} logoUrl={article.blog.logoUrl} />
        <span className="font-medium text-fg">{article.blog.name}</span>
        <span aria-hidden>·</span>
        <span>{formatDate(article.publishedAt)}</span>
        {bookmarkable && (
          <BookmarkButton
            articleId={article.id}
            initialBookmarked={initialBookmarked}
            className="ml-auto"
          />
        )}
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
        className="mt-auto self-end inline-flex items-center gap-1 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg no-underline hover:bg-primary-soft hover:text-primary transition-colors"
      >
        원문 보기 ↗
      </a>
    </article>
  );
}
