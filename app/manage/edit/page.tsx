"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { SubscriptionEditor } from "@/components/subscription/SubscriptionEditor";

export default function ManageEditPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <main className="max-w-[760px] mx-auto px-6 py-24 text-center text-muted">불러오는 중…</main>;
  }

  if (!user) {
    return (
      <main className="max-w-[460px] mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-[22px] p-9">
          <LoginPanel />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[760px] mx-auto px-6 py-12">
      <SubscriptionEditor mode="edit" />
    </main>
  );
}
