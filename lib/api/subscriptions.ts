import { ApiError } from "@/lib/api/client";
import type { Keyword, Topic } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export interface Subscriptions {
  topics: Topic[];
  keywords: Keyword[];
}

async function authedFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new ApiError(response.status, `${init?.method ?? "GET"} ${path} (${response.status})`);
  }
  return response;
}

export async function getSubscriptions(token: string): Promise<Subscriptions> {
  return (await authedFetch("/api/subscriptions", token)).json();
}

export async function replaceSubscriptions(
  token: string,
  topicIds: number[],
  keywordIds: number[],
): Promise<Subscriptions> {
  const response = await authedFetch("/api/subscriptions", token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topicIds, keywordIds }),
  });
  return response.json();
}

export async function unsubscribeAll(token: string): Promise<void> {
  await authedFetch("/api/subscriptions", token, { method: "DELETE" });
}

export async function agreeConsent(token: string): Promise<void> {
  await authedFetch("/api/members/me/consent", token, { method: "POST" });
}
