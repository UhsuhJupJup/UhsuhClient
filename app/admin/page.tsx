"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getMember } from "@/lib/api/members";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { AdminRuns } from "@/components/admin/AdminRuns";
import { AdminBlogs } from "@/components/admin/AdminBlogs";
import { AdminEmailSubscribers } from "@/components/admin/AdminEmailSubscribers";
import { AdminEmailSendLogs } from "@/components/admin/AdminEmailSendLogs";
import { AdminOutbox } from "@/components/admin/AdminOutbox";
import { PageHeader } from "@/components/PageHeader";
import type { MemberRole } from "@/lib/types";

type TabKey = "runs" | "blogs" | "subscribers" | "sendLogs" | "outbox";

const TABS: { key: TabKey; label: string; render: () => ReactNode }[] = [
  { key: "runs", label: "실행 이력", render: () => <AdminRuns /> },
  { key: "blogs", label: "블로그", render: () => <AdminBlogs /> },
  { key: "subscribers", label: "이메일 구독자", render: () => <AdminEmailSubscribers /> },
  { key: "sendLogs", label: "발송 로그", render: () => <AdminEmailSendLogs /> },
  { key: "outbox", label: "아웃박스", render: () => <AdminOutbox /> },
];

export default function AdminPage() {
  const { user, loading, getIdToken } = useAuth();
  const [role, setRole] = useState<MemberRole | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<TabKey>("runs");

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
      <PageHeader
        eyebrow="Admin"
        title="관리자"
        description="수집 파이프라인 실행 이력과 블로그 소스, 이메일 구독자와 발송 로그를 관리하세요."
      />

      <div
        role="tablist"
        aria-label="관리자 메뉴"
        className="border-b border-border mb-8 flex gap-1 overflow-x-auto"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section>{TABS.find((t) => t.key === tab)?.render()}</section>
    </main>
  );
}
