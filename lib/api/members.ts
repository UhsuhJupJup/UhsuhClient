import { ApiError } from "@/lib/api/client";
import type { Member } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

async function authedFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new ApiError(response.status, `${init?.method ?? "GET"} ${path} (${response.status})`);
  }
  return response;
}

export async function getMember(token: string): Promise<Member> {
  return (await authedFetch("/api/members/me", token)).json();
}
