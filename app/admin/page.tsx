"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getMember } from "@/lib/api/members";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { AdminRuns } from "@/components/admin/AdminRuns";
import { AdminBlogs } from "@/components/admin/AdminBlogs";
import type { MemberRole } from "@/lib/types";

export default function AdminPage() {
  const { user, loading, getIdToken } = useAuth();
  const [role, setRole] = useState<MemberRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    (async () => {
      try {
        const token = await getIdToken();
        if (!token) throw new Error("missing token");
        const member = await getMember(token);
        if (active) setRole(member.role);
      } catch {
        if (active) setRole(null);
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loading, user, getIdToken]);

  if (!loading && !user) {
    return (
      <main className="max-w-[460px] mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-[22px] p-9">
          <LoginPanel />
        </div>
      </main>
    );
  }

  if (loading || checking) {
    return (
      <main className="max-w-[760px] mx-auto px-6 py-24 text-center text-muted">불러오는 중…</main>
    );
  }

  if (role !== "ADMIN") {
    return (
      <main className="max-w-[460px] mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-[22px] p-9 text-center">
          <h1 className="text-2xl font-extrabold m-0">접근 권한이 없어요</h1>
          <p className="text-base text-muted mt-3 mb-7">이 페이지는 관리자만 볼 수 있어요.</p>
          <Link
            href="/"
            className="inline-flex items-center bg-primary text-primary-fg px-5 py-3 rounded-xl font-bold text-sm no-underline hover:opacity-90 transition-opacity"
          >
            홈으로 가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1100px] mx-auto px-6 py-12">
      <h1 className="text-[36px] font-extrabold tracking-[-0.025em] m-0">관리자</h1>
      <p className="text-base text-muted mt-2 mb-10">
        수집 파이프라인 실행 이력과 블로그 소스를 관리하세요.
      </p>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">실행 이력</h2>
        <AdminRuns />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">블로그 관리</h2>
        <AdminBlogs />
      </section>
    </main>
  );
}
