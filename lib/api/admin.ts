import { ApiError } from "@/lib/api/client";
import type { AdminBlog, PipelineRun } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

async function authedFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new ApiError(response.status, `${init?.method ?? "GET"} ${path} (${response.status})`);
  }
  return response;
}

export async function getRuns(token: string, limit = 30): Promise<PipelineRun[]> {
  return (await authedFetch(`/api/admin/runs?limit=${limit}`, token)).json();
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
