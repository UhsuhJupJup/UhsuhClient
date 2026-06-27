import { apiGet } from "@/lib/api/client";
import type { ArticleCardData, ArticleDetail } from "@/lib/types";

export interface ArticleQuery {
  topicId?: number;
  keywordId?: number;
  blogId?: number;
  q?: string;
  limit?: number;
}

export function getArticles(query: ArticleQuery = {}): Promise<ArticleCardData[]> {
  const params = new URLSearchParams();
  if (query.topicId) params.set("topicId", String(query.topicId));
  if (query.keywordId) params.set("keywordId", String(query.keywordId));
  if (query.blogId) params.set("blogId", String(query.blogId));
  if (query.q) params.set("q", query.q);
  if (query.limit) params.set("limit", String(query.limit));
  const queryString = params.toString();
  return apiGet<ArticleCardData[]>(`/api/articles${queryString ? `?${queryString}` : ""}`);
}

export function getArticle(id: number): Promise<ArticleDetail> {
  return apiGet<ArticleDetail>(`/api/articles/${id}`);
}
