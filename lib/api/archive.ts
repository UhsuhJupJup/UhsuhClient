import { authedFetch } from "@/lib/api/client";
import type { BookmarkItem, NotificationItem } from "@/lib/types";

export interface NotificationList {
  content: NotificationItem[];
}

export interface BookmarkList {
  content: BookmarkItem[];
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
