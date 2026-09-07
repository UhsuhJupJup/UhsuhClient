import { authedFetch } from "@/lib/api/client";
import type {
  AdminBlog,
  AdminEmailSubscriber,
  AdminOutbox,
  EmailSendLog,
  EmailSendLogDaily,
  PipelineRunPage,
} from "@/lib/types";

export async function getRuns(
  token: string,
  page = 0,
  size = 20,
): Promise<PipelineRunPage> {
  return (await authedFetch(`/api/admin/runs?page=${page}&size=${size}`, token)).json();
}

export interface NotificationRunResult {
  membersNotified: number;
  notificationsRecorded: number;
  failedMembers: number;
}

export async function triggerNotification(
  token: string,
): Promise<NotificationRunResult | null> {
  return (await authedFetch("/api/admin/runs/notification", token, { method: "POST" })).json();
}

export async function getAdminBlogs(token: string): Promise<AdminBlog[]> {
  return (await authedFetch("/api/admin/blogs", token)).json();
}

export async function createBlog(
  token: string,
  body: { name: string; domain: string; rssUrl: string; logoUrl?: string | null },
): Promise<AdminBlog> {
  const response = await authedFetch("/api/admin/blogs", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

export async function updateBlog(
  token: string,
  id: number,
  body: { name: string; rssUrl: string; logoUrl?: string | null },
): Promise<AdminBlog> {
  const response = await authedFetch(`/api/admin/blogs/${id}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

export async function deactivateBlog(token: string, id: number): Promise<void> {
  await authedFetch(`/api/admin/blogs/${id}/deactivate`, token, { method: "PATCH" });
}

export async function activateBlog(token: string, id: number): Promise<void> {
  await authedFetch(`/api/admin/blogs/${id}/activate`, token, { method: "PATCH" });
}

export async function getEmailSubscribers(token: string): Promise<AdminEmailSubscriber[]> {
  return (await authedFetch("/api/admin/email-subscriptions", token)).json();
}

export async function getEmailSendLogs(token: string, limit = 50): Promise<EmailSendLog[]> {
  return (await authedFetch(`/api/admin/email-send-logs?limit=${limit}`, token)).json();
}

export async function getEmailSendLogDaily(token: string): Promise<EmailSendLogDaily[]> {
  return (await authedFetch("/api/admin/email-send-logs/daily", token)).json();
}

export async function getEmailSendLogsByDate(
  token: string,
  date: string,
): Promise<EmailSendLog[]> {
  return (await authedFetch(`/api/admin/email-send-logs?date=${date}`, token)).json();
}

export async function getOutbox(token: string, failedLimit = 50): Promise<AdminOutbox> {
  return (await authedFetch(`/api/admin/outbox?failedLimit=${failedLimit}`, token)).json();
}

export async function requeueOutbox(token: string, id: number): Promise<void> {
  await authedFetch(`/api/admin/outbox/${id}/requeue`, token, { method: "POST" });
}
