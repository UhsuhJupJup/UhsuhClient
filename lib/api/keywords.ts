import { apiGet } from "@/lib/api/client";
import type { KeywordDetail } from "@/lib/types";

export function getKeyword(id: number): Promise<KeywordDetail> {
  return apiGet<KeywordDetail>(`/api/keywords/${id}`);
}
