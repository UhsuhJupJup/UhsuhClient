import { apiGet } from "@/lib/api/client";
import type { Blog } from "@/lib/types";

export function getBlogs(): Promise<Blog[]> {
  return apiGet<Blog[]>("/api/blogs");
}

export function getBlog(id: number): Promise<Blog> {
  return apiGet<Blog>(`/api/blogs/${id}`);
}
