import { ArticleCard } from "@/components/ArticleCard";
import type { ArticleCardData } from "@/lib/types";

export function RecentArticles({ articles }: { articles: ArticleCardData[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-extrabold tracking-[-0.02em] mb-5">최근 글</h2>
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">아직 수집된 글이 없어요.</p>
      )}
    </section>
  );
}
