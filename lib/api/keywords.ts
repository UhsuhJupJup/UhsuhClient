import { apiGet } from "@/lib/api/client";
import type { Keyword, KeywordDetail } from "@/lib/types";

export function getKeyword(id: number): Promise<KeywordDetail> {
  return apiGet<KeywordDetail>(`/api/keywords/${id}`);
}

export function searchKeywords(query: string): Promise<Keyword[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const queryString = params.toString();
  return apiGet<Keyword[]>(`/api/keywords${queryString ? `?${queryString}` : ""}`);
}
