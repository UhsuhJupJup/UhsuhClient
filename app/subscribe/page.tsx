"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { SubscriptionEditor } from "@/components/subscription/SubscriptionEditor";

export default function SubscribePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <main className="max-w-[760px] mx-auto px-6 py-24 text-center text-muted">불러오는 중…</main>;
  }

  if (!user) {
    return (
      <main className="max-w-[460px] mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-[22px] p-9">
          <LoginPanel />
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
    <main className="max-w-[760px] mx-auto px-6 py-12">
      <SubscriptionEditor />
    </main>
  );
}
