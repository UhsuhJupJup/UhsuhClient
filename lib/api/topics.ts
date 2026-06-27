import { apiGet } from "@/lib/api/client";
import type { Topic, TopicDetail } from "@/lib/types";

export function getTopics(): Promise<Topic[]> {
  return apiGet<Topic[]>("/api/topics");
}

export function getTopic(id: number): Promise<TopicDetail> {
  return apiGet<TopicDetail>(`/api/topics/${id}`);
}
