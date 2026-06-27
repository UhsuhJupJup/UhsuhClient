"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ExploreSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    router.push(`/explore${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--muted)"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4-4" />
      </svg>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="제목 검색"
        className="flex-1 bg-transparent outline-none text-base text-fg placeholder:text-muted"
      />
    </form>
  );
}
