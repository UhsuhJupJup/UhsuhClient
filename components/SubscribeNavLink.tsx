"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getSubscriptions } from "@/lib/api/subscriptions";

export function SubscribeNavLink({ className }: { className?: string }) {
  const { user, getIdToken } = useAuth();
  const router = useRouter();

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    if (!user) {
      router.push("/subscribe");
      return;
    }
    let target = "/subscribe";
    try {
      const token = await getIdToken();
      if (token) {
        const subscriptions = await getSubscriptions(token);
        if (subscriptions.topics.length > 0 || subscriptions.keywords.length > 0) {
          target = "/manage";
        }
      }
    } catch {
      target = "/subscribe";
    }
    router.push(target);
  }

  return (
    <a href="/subscribe" onClick={handleClick} className={className}>
      구독
    </a>
  );
}
