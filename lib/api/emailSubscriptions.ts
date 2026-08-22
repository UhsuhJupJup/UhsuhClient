import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { ManagedEmailSubscriptions } from "@/lib/types";

export async function registerEmailSubscription(email: string, keywordIds: number[]): Promise<void> {
  await apiPost("/api/email-subscriptions", { email, keywordIds });
}

export async function requestEmailManageLink(email: string): Promise<void> {
  await apiPost("/api/email-subscriptions/manage-link", { email });
}

export function getEmailSubscriptions(token: string): Promise<ManagedEmailSubscriptions> {
  return apiGet<ManagedEmailSubscriptions>(
    `/api/email-subscriptions/manage?token=${encodeURIComponent(token)}`,
  );
}

export async function updateEmailSubscriptions(token: string, keywordIds: number[]): Promise<void> {
  await apiPut(`/api/email-subscriptions/manage?token=${encodeURIComponent(token)}`, { keywordIds });
}
