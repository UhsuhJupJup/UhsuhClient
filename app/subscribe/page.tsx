"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { SubscriptionEditor } from "@/components/subscription/SubscriptionEditor";

export default function SubscribePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  if (loading || redirecting) {
    return <main className="max-w-[760px] mx-auto px-6 py-24 text-center text-muted">불러오는 중…</main>;
  }

  if (!user) {
    return (
      <main className="max-w-[460px] mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-[22px] p-9">
          <LoginPanel
            onDone={() => {
              setRedirecting(true);
              router.replace("/");
            }}
          />
          <Link
            href="/subscribe/email"
            className="flex items-center justify-center w-full mt-3 bg-card border border-border text-fg px-5 py-3.5 rounded-xl font-bold text-base no-underline hover:border-primary hover:text-primary hover:bg-primary-soft transition-colors"
          >
            로그인 없이 이메일로 구독하기
          </Link>
          <p className="text-center text-sm text-muted mt-6">
            먼저 둘러볼까요?{" "}
            <Link href="/explore" className="text-primary font-semibold no-underline">
              토픽 탐색하기 →
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1040px] mx-auto px-6 py-12">
      <SubscriptionEditor />
    </main>
  );
}
