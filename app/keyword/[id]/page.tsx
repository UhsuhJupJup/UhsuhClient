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
import { RelatedKeywordList } from "@/components/keyword/RelatedKeywordList";
import { formatCount } from "@/lib/format";

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
  const relatedKeywords = keyword.relatedKeywords ?? [];

  return (
    <main className="max-w-[1000px] mx-auto px-6 py-12">
      <BackLink />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <DetailBadge label="키워드" />
          <h1 className="font-mono text-[36px] font-extrabold tracking-[-0.025em] m-0 [overflow-wrap:anywhere]">{keyword.name}</h1>
          {keyword.topics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
              {keyword.topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/explore?tab=topic&topicIds=${topic.id}`}
                  className="text-muted no-underline hover:text-primary transition-colors"
                >
                  토픽 · {topic.name}
                </Link>
              ))}
            </div>
          )}
          {keyword.articleCount !== undefined && (
            <p className="mt-3.5 mb-0 text-[15px] text-muted">
              주워온 글{" "}
              <b className="font-mono text-[22px] font-extrabold tracking-[-0.02em] text-fg tabular-nums">
                {formatCount(keyword.articleCount)}
              </b>
              개
            </p>
          )}
        </div>
        <SubscribeCta label="+ 이 키워드 구독" />
      </div>

      {relatedKeywords.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em] mb-5">함께 자주 나온 키워드</h2>
          <RelatedKeywordList keywords={relatedKeywords} />
        </section>
      )}

      <RecentArticles articles={articles} />
    </main>
  );
}
