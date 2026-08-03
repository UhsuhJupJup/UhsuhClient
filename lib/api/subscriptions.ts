import { authedFetch } from "@/lib/api/client";
import type { Keyword, Topic } from "@/lib/types";

export interface Subscriptions {
  topics: Topic[];
  keywords: Keyword[];
}

export async function getSubscriptions(token: string): Promise<Subscriptions> {
  return (await authedFetch("/api/subscriptions", token)).json();
}

export async function replaceSubscriptions(
  token: string,
  keywordIds: number[],
): Promise<Subscriptions> {
  const response = await authedFetch("/api/subscriptions", token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topicIds: [], keywordIds }),
  });
  return response.json();
}

export async function unsubscribeAll(token: string): Promise<void> {
  await authedFetch("/api/subscriptions", token, { method: "DELETE" });
}

export async function agreeConsent(token: string): Promise<void> {
  await authedFetch("/api/members/me/consent", token, { method: "POST" });
}
