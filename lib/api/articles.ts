import { apiGet } from "@/lib/api/client";
import type { ArticleDetail, ArticlePage } from "@/lib/types";

export interface ArticleQuery {
  topicIds?: number[];
  keywordIds?: number[];
  blogId?: number;
  q?: string;
  page?: number;
  size?: number;
}

export function getArticles(query: ArticleQuery = {}): Promise<ArticlePage> {
  const params = new URLSearchParams();
  if (query.topicIds?.length) params.set("topicIds", query.topicIds.join(","));
  if (query.keywordIds?.length) params.set("keywordIds", query.keywordIds.join(","));
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
