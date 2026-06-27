import { apiGet } from "@/lib/api/client";
import type { Topic } from "@/lib/types";

export function getTopics(): Promise<Topic[]> {
  return apiGet<Topic[]>("/api/topics");
}
