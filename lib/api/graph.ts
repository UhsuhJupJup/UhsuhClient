import { apiGet, authedFetch } from "@/lib/api/client";
import type { NoteGraph } from "@/lib/types";

export async function getGlobalGraph(): Promise<NoteGraph> {
  return apiGet<NoteGraph>("/api/graph");
}

export async function getMyGraph(token: string): Promise<NoteGraph> {
  return (await authedFetch("/api/graph/mine", token)).json();
}
