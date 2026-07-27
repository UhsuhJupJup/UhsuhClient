import type { RecommendedArticle } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function RecommendedArticleCard({
  article,
  divider = false,
}: {
  article: RecommendedArticle;
  divider?: boolean;
}) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block no-underline py-3 ${divider ? "border-t border-border" : ""}`}
    >
      <h3 className="m-0 text-sm font-bold leading-snug text-fg group-hover:text-primary transition-colors">
        {article.title}
        <span aria-hidden className="text-muted font-normal"> ↗</span>
      </h3>
      <p className="mt-1 mb-0 text-xs text-muted">
        {article.blogName} · {formatDate(article.publishedAt)}
      </p>
    </a>
  );
}
