import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle } from "@/lib/api/articles";
import { ApiError } from "@/lib/api/client";
import type { ArticleDetail } from "@/lib/types";
import { BackLink } from "@/components/BackLink";
import { formatDate } from "@/lib/format";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleId = Number(id);

  let article: ArticleDetail;
  try {
    article = await getArticle(articleId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main className="max-w-[760px] mx-auto px-6 py-12">
      <BackLink href="/explore" label="← 목록으로" />

      <div className="flex items-center gap-2 text-sm text-muted">
        <Link
          href={`/blog/${article.blog.id}`}
          className="inline-flex items-center gap-2 text-fg no-underline hover:text-primary transition-colors"
        >
          <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-chip-bg text-fg font-bold text-[11px]">
            {article.blog.name.charAt(0)}
          </span>
          <span className="font-medium">{article.blog.name}</span>
        </Link>
        <span aria-hidden>·</span>
        <span>{formatDate(article.publishedAt)}</span>
      </div>

      <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.02em] mt-4 mb-5">
        {article.title}
      </h1>

      {article.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {article.keywords.map((keyword) => (
            <Link
              key={keyword.id}
              href={`/keyword/${keyword.id}`}
              className="font-mono text-sm text-fg bg-card border border-border px-3 py-1.5 rounded-lg no-underline hover:border-primary hover:text-primary hover:bg-primary-soft transition-colors"
            >
              {keyword.name}
            </Link>
          ))}
        </div>
      )}

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-primary text-primary-fg px-6 py-3.5 rounded-[11px] font-bold text-base no-underline hover:opacity-90 transition-opacity"
      >
        원문 전체 보기 ↗
      </a>

      <p className="text-sm text-muted mt-4">
        어서줍줍은 본문을 직접 보여주지 않고, 원문({article.blog.domain})으로 연결합니다.
      </p>
    </main>
  );
}
