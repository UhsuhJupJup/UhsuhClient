import { apiGet } from "@/lib/api/client";
import type { Keyword, KeywordDetail, KeywordGraph, TopKeyword } from "@/lib/types";

export function getKeyword(id: number): Promise<KeywordDetail> {
  return apiGet<KeywordDetail>(`/api/keywords/${id}`);
}

export function getTopKeyword(): Promise<TopKeyword> {
  return apiGet<TopKeyword>("/api/keywords/top");
}

export function getKeywordGraph(id: number): Promise<KeywordGraph> {
  return apiGet<KeywordGraph>(`/api/keywords/${id}/graph`);
}

export function searchKeywords(query: string): Promise<Keyword[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const queryString = params.toString();
  return apiGet<Keyword[]>(`/api/keywords${queryString ? `?${queryString}` : ""}`);
}
