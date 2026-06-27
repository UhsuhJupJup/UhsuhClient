import Link from "next/link";
import { getTopics } from "@/lib/api/topics";
import { getBlogs } from "@/lib/api/blogs";
import { Logo } from "@/components/Logo";

export default async function LandingPage() {
  const [topics, blogs] = await Promise.all([getTopics(), getBlogs()]);

  return (
    <main className="max-w-[1200px] mx-auto px-6">
      <section className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-10 items-center pt-16 pb-14">
        <div>
          <h1 className="text-[52px] leading-[1.12] font-extrabold tracking-[-0.03em] m-0">
            관심 기술,
            <br />
            어서 줍줍하세요.
          </h1>
          <p className="text-lg leading-[1.65] text-muted mt-5 mb-8 max-w-[460px]">
            토픽, 키워드만 담아두면 기술 블로그의 새 글이 올라오면 주워다드려요.
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
              className="inline-flex items-center bg-transparent text-fg border border-border px-6 py-[15px] rounded-[11px] font-bold text-base no-underline hover:border-primary hover:text-primary transition-colors"
            >
              토픽 둘러보기
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden bg-card border border-border rounded-[22px] p-10 flex items-center justify-center min-h-[300px] shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                "radial-gradient(circle at 70% 25%, var(--accent) 0%, transparent 42%)",
            }}
          />
          <Logo size={150} className="relative text-primary" />
        </div>
      </section>

      <section className="pt-2 pb-12">
        <p className="text-[28px] font-extrabold tracking-[-0.02em] mb-1.5">
          인기 토픽
        </p>
        <p className="text-[15px] text-muted mb-[22px]">
          바로 칩을 눌러 키워드를 살펴보세요.
        </p>
        <div className="flex flex-wrap gap-3">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topic/${topic.id}`}
              className="font-mono text-[15px] text-fg bg-card border border-border px-[18px] py-[11px] rounded-[10px] no-underline font-medium hover:border-primary hover:text-primary hover:bg-primary-soft transition-colors"
            >
              {topic.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-2 pb-14">
        <p className="text-[28px] font-extrabold tracking-[-0.02em] mb-1.5">
          수집 중인 블로그
        </p>
        <p className="text-[15px] text-muted mb-[22px]">
          {blogs.length}개 기술 블로그의 새 글을 매일 확인합니다.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.id}`}
              className="text-sm text-fg bg-card border border-border px-3.5 py-2.5 rounded-[9px] no-underline font-medium hover:border-primary hover:text-primary transition-colors"
            >
              {blog.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
