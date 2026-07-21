import type { RecommendedArticle } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function RecommendedArticleCard({ article }: { article: RecommendedArticle }) {
  return (
    <article className="bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block no-underline"
      >
        <div className="flex items-center gap-2 text-xs text-muted mb-2">
          <span className="inline-flex w-5 h-5 shrink-0 items-center justify-center rounded bg-chip-bg text-fg font-bold text-[10px]">
            {article.blogName.charAt(0)}
          </span>
          <span className="font-medium text-fg truncate">{article.blogName}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">{formatDate(article.publishedAt)}</span>
        </div>
        <h3 className="m-0 text-[15px] font-bold leading-snug text-fg group-hover:text-primary transition-colors">
          {article.title}
          <span aria-hidden className="text-muted font-normal"> ↗</span>
        </h3>
      </a>

      {article.matchedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {article.matchedKeywords.map((keyword) => (
            <span
              key={keyword}
              className="font-mono text-[11px] text-primary bg-primary-soft px-1.5 py-0.5 rounded"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
