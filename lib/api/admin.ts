import { authedFetch } from "@/lib/api/client";
import type { AdminBlog, PipelineRun } from "@/lib/types";

export async function getRuns(token: string, limit = 30): Promise<PipelineRun[]> {
  return (await authedFetch(`/api/admin/runs?limit=${limit}`, token)).json();
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
  body: { name: string; domain: string; rssUrl: string },
): Promise<AdminBlog> {
  const response = await authedFetch("/api/admin/blogs", token, {
    method: "POST",
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
