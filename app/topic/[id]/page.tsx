import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopic } from "@/lib/api/topics";
import { getArticles } from "@/lib/api/articles";
import { ApiError } from "@/lib/api/client";
import type { TopicDetail } from "@/lib/types";
import { BackLink } from "@/components/BackLink";
import { DetailBadge } from "@/components/DetailBadge";
import { SubscribeCta } from "@/components/SubscribeCta";
import { RecentArticles } from "@/components/RecentArticles";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topicId = Number(id);

  let topic: TopicDetail;
  try {
    topic = await getTopic(topicId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const articles = await getArticles({ topicId, limit: 20 });

  return (
    <main className="max-w-[1000px] mx-auto px-6 py-12">
      <BackLink />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <DetailBadge label="토픽" />
          <h1 className="text-[36px] font-extrabold tracking-[-0.025em] m-0">{topic.name}</h1>
        </div>
        <SubscribeCta label="+ 이 토픽 구독" />
      </div>

      {topic.keywords.length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-bold text-muted mb-3">하위 키워드</h2>
          <div className="flex flex-wrap gap-2">
            {topic.keywords.map((keyword) => (
              <Link
                key={keyword.id}
                href={`/keyword/${keyword.id}`}
                className="font-mono text-sm text-fg bg-card border border-border px-3.5 py-2 rounded-lg no-underline hover:border-primary hover:text-primary hover:bg-primary-soft transition-colors"
              >
                {keyword.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <RecentArticles articles={articles} />
    </main>
  );
}
