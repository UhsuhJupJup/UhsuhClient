import { notFound } from "next/navigation";
import { getBlog } from "@/lib/api/blogs";
import { getArticles } from "@/lib/api/articles";
import { ApiError } from "@/lib/api/client";
import type { Blog } from "@/lib/types";
import { BackLink } from "@/components/BackLink";
import { DetailBadge } from "@/components/DetailBadge";
import { RecentArticles } from "@/components/RecentArticles";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blogId = Number(id);

  let blog: Blog;
  try {
    blog = await getBlog(blogId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const articles = await getArticles({ blogId, limit: 20 });

  return (
    <main className="max-w-[1000px] mx-auto px-6 py-12">
      <BackLink />
      <div>
        <DetailBadge label="블로그" />
        <h1 className="text-[36px] font-extrabold tracking-[-0.025em] m-0">{blog.name}</h1>
        <a
          href={`https://${blog.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 font-mono text-sm text-muted no-underline hover:text-primary transition-colors"
        >
          {blog.domain} ↗
        </a>
      </div>

      <RecentArticles articles={articles} />
    </main>
  );
}
