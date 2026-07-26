import { ApiError } from "@/lib/api/client";
import type { BookmarkItem, NotificationItem } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export interface NotificationList {
  content: NotificationItem[];
}

export interface BookmarkList {
  content: BookmarkItem[];
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

export async function getNotifications(token: string): Promise<NotificationList> {
  return (await authedFetch("/api/me/notifications", token)).json();
}

export async function getBookmarks(token: string): Promise<BookmarkList> {
  return (await authedFetch("/api/me/bookmarks", token)).json();
}

export async function addBookmark(token: string, articleId: number): Promise<void> {
  await authedFetch(`/api/me/bookmarks/${articleId}`, token, { method: "POST" });
}

export async function removeBookmark(token: string, articleId: number): Promise<void> {
  await authedFetch(`/api/me/bookmarks/${articleId}`, token, { method: "DELETE" });
}
