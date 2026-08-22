import Image from "next/image";
import Link from "next/link";
import { getTopics } from "@/lib/api/topics";
import { getBlogs } from "@/lib/api/blogs";

export default async function LandingPage() {
  const [topics, blogs] = await Promise.all([getTopics(), getBlogs()]);

  return (
    <main className="bg-white">
      <div className="max-w-[1160px] mx-auto px-6">
        <section className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-14 items-center pt-20 pb-16">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-acorn m-0">
              기술 블로그 키워드 큐레이션
            </p>
            <h1 className="text-[40px] sm:text-[52px] leading-[1.1] font-extrabold tracking-[-0.03em] text-fg mt-4 mb-0">
              관심 기술,
              <br />
              어서 <span className="text-primary">줍줍</span>하세요.
            </h1>
            <p className="text-lg leading-[1.7] text-muted mt-6 mb-9 max-w-[440px]">
              토픽·키워드만 담아두면 기술 블로그의 새 글을 주워다드려요
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/subscribe"
                className="inline-flex items-center gap-2 bg-primary text-primary-fg px-[26px] py-[15px] rounded-[11px] font-bold text-base no-underline hover:opacity-90 transition-opacity"
              >
                줍줍 시작하기 →
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center bg-transparent text-fg border border-border px-6 py-[15px] rounded-[11px] font-bold text-base no-underline hover:border-acorn hover:text-acorn transition-colors"
              >
                줍줍한 글 보러가기
              </Link>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <Image
              src="/mascot-hero.png"
              alt="어서줍줍 마스코트 — 숲에서 도토리를 줍는 다람쥐"
              width={950}
              height={1082}
              priority
              sizes="(max-width: 768px) 100vw, 420px"
              className="w-full h-auto max-w-[420px] rounded-[24px] border border-border shadow-[0_16px_44px_rgba(31,111,74,0.14)]"
            />
          </div>
        </section>

        <div className="border-t border-border" />

        <section className="pt-14 pb-12">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-acorn m-0">
            Topics
          </p>
          <h2 className="text-[30px] font-extrabold tracking-[-0.02em] text-fg mt-2 mb-1.5">
            줍줍하는 토픽
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/explore?tab=topic&topicIds=${topic.id}`}
                className="font-mono text-[15px] text-fg bg-white border border-border px-[18px] py-[11px] rounded-[10px] no-underline font-medium hover:border-primary hover:text-primary hover:bg-primary-soft transition-colors"
              >
                {topic.name}
              </Link>
            ))}
          </div>
        </section>

        <div className="border-t border-border" />

        <section className="pt-14 pb-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-acorn m-0">
            Blogs
          </p>
          <h2 className="text-[30px] font-extrabold tracking-[-0.02em] text-fg mt-2 mb-1.5">
            수집 중인 블로그
          </h2>
          <p className="text-[15px] text-muted mb-6">
            {blogs.length}개 기술 블로그의 새 글을 매일 확인합니다.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/explore?tab=blog&blogId=${blog.id}`}
                className="text-sm text-fg bg-white border border-border px-3.5 py-2.5 rounded-[9px] no-underline font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {blog.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
