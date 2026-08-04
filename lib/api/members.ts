import { authedFetch } from "@/lib/api/client";
import type { Member } from "@/lib/types";

export async function getMember(token: string): Promise<Member> {
  return (await authedFetch("/api/members/me", token)).json();
}
