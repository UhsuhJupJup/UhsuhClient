import { apiGet } from "@/lib/api/client";
import type { ArticleDetail, ArticlePage } from "@/lib/types";

export interface ArticleQuery {
  topicId?: number;
  keywordId?: number;
  blogId?: number;
  q?: string;
  page?: number;
  size?: number;
}

export function getArticles(query: ArticleQuery = {}): Promise<ArticlePage> {
  const params = new URLSearchParams();
  if (query.topicId) params.set("topicId", String(query.topicId));
  if (query.keywordId) params.set("keywordId", String(query.keywordId));
  if (query.blogId) params.set("blogId", String(query.blogId));
  if (query.q) params.set("q", query.q);
  if (query.page) params.set("page", String(query.page));
  if (query.size) params.set("size", String(query.size));
  const queryString = params.toString();
  return apiGet<ArticlePage>(`/api/articles${queryString ? `?${queryString}` : ""}`);
}

export function getArticle(id: number): Promise<ArticleDetail> {
  return apiGet<ArticleDetail>(`/api/articles/${id}`);
}
