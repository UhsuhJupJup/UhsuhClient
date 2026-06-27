import { Suspense } from "react";
import Link from "next/link";
import { getArticles } from "@/lib/api/articles";
import { getTopics } from "@/lib/api/topics";
import { getBlogs } from "@/lib/api/blogs";
import { ArticleCard } from "@/components/ArticleCard";
import { ExploreSearch } from "@/components/ExploreSearch";

type ExploreParams = {
  tab?: string;
  topicId?: string;
  blogId?: string;
  q?: string;
};

function buildHref(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const queryString = search.toString();
  return `/explore${queryString ? `?${queryString}` : ""}`;
}

const tabBase =
  "px-3.5 py-2 rounded-lg font-semibold text-sm no-underline transition-colors";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<ExploreParams>;
}) {
  const params = await searchParams;
  const tab = params.tab === "topic" || params.tab === "blog" ? params.tab : "all";
  const topicId = params.topicId ? Number(params.topicId) : undefined;
  const blogId = params.blogId ? Number(params.blogId) : undefined;
  const q = params.q?.trim() || undefined;

  const articles = await getArticles({
    topicId: tab === "topic" ? topicId : undefined,
    blogId: tab === "blog" ? blogId : undefined,
    q,
  });
  const topics = tab === "topic" ? await getTopics() : [];
  const blogs = tab === "blog" ? await getBlogs() : [];

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <h1 className="text-[36px] font-extrabold tracking-[-0.025em] m-0">탐색</h1>
      <p className="text-base text-muted mt-2 mb-8">
        수집된 기술 블로그 글을 모아봤어요. 토픽, 블로그로 필터링하거나 제목으로 검색해 보세요.
      </p>

      <Suspense fallback={null}>
        <ExploreSearch />
      </Suspense>

      <div className="flex gap-1.5 mt-6">
        <Link
          href={buildHref({ q })}
          className={`${tabBase} ${tab === "all" ? "bg-primary text-primary-fg" : "text-muted hover:text-fg hover:bg-chip-bg"}`}
        >
          전체
        </Link>
        <Link
          href={buildHref({ tab: "topic", q })}
          className={`${tabBase} ${tab === "topic" ? "bg-primary text-primary-fg" : "text-muted hover:text-fg hover:bg-chip-bg"}`}
        >
          토픽
        </Link>
        <Link
          href={buildHref({ tab: "blog", q })}
          className={`${tabBase} ${tab === "blog" ? "bg-primary text-primary-fg" : "text-muted hover:text-fg hover:bg-chip-bg"}`}
        >
          블로그
        </Link>
      </div>

      {tab === "topic" && (
        <div className="flex flex-wrap gap-2 mt-4">
          {topics.map((topic) => {
            const active = topic.id === topicId;
            return (
              <Link
                key={topic.id}
                href={buildHref({ tab: "topic", topicId: active ? undefined : String(topic.id), q })}
                className={`font-mono text-sm px-3.5 py-2 rounded-lg no-underline border transition-colors ${
                  active
                    ? "bg-primary text-primary-fg border-primary"
                    : "bg-card text-fg border-border hover:border-primary hover:text-primary"
                }`}
              >
                {active ? "✓ " : ""}
                {topic.name}
              </Link>
            );
          })}
        </div>
      )}

      {tab === "blog" && (
        <div className="flex flex-wrap gap-2 mt-4">
          {blogs.map((blog) => {
            const active = blog.id === blogId;
            return (
              <Link
                key={blog.id}
                href={buildHref({ tab: "blog", blogId: active ? undefined : String(blog.id), q })}
                className={`text-sm px-3.5 py-2 rounded-lg no-underline border transition-colors ${
                  active
                    ? "bg-primary text-primary-fg border-primary"
                    : "bg-card text-fg border-border hover:border-primary hover:text-primary"
                }`}
              >
                {active ? "✓ " : ""}
                {blog.name}
              </Link>
            );
          })}
        </div>
      )}

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-2 py-20">
          <h3 className="text-lg font-bold text-fg m-0">조건에 맞는 글이 없어요</h3>
          <p className="text-sm text-muted m-0">다른 키워드로 검색하거나 필터를 바꿔보세요.</p>
        </div>
      )}
    </main>
  );
}
