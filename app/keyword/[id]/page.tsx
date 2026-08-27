import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKeyword } from "@/lib/api/keywords";
import { getArticles } from "@/lib/api/articles";
import { ApiError } from "@/lib/api/client";
import type { KeywordDetail } from "@/lib/types";
import { BackLink } from "@/components/BackLink";
import { DetailBadge } from "@/components/DetailBadge";
import { SubscribeCta } from "@/components/SubscribeCta";
import { RecentArticles } from "@/components/RecentArticles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const keyword = await getKeyword(Number(id));
    return {
      title: `${keyword.name} 키워드`,
      description: `${keyword.name} 키워드로 주워온 기술 블로그 글 모음`,
      alternates: { canonical: `/keyword/${id}` },
      openGraph: { url: `/keyword/${id}`, title: `${keyword.name} 키워드 | 어서줍줍` },
    };
  } catch {
    return { title: "키워드", alternates: { canonical: `/keyword/${id}` } };
  }
}

export default async function KeywordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const keywordId = Number(id);

  let keyword: KeywordDetail;
  try {
    keyword = await getKeyword(keywordId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const { content: articles } = await getArticles({ keywordIds: [keywordId], size: 20 });

  return (
    <main className="max-w-[1000px] mx-auto px-6 py-12">
      <BackLink />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <DetailBadge label="키워드" />
          <h1 className="font-mono text-[36px] font-extrabold tracking-[-0.025em] m-0">{keyword.name}</h1>
          {keyword.topics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
              {keyword.topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topic/${topic.id}`}
                  className="text-muted no-underline hover:text-primary transition-colors"
                >
                  토픽 · {topic.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        <SubscribeCta label="+ 이 키워드 구독" />
      </div>

      <RecentArticles articles={articles} />
    </main>
  );
}
