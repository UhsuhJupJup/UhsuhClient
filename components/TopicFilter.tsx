"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Topic } from "@/lib/types";

function parseIds(value: string | null): number[] {
  if (!value) return [];
  return value.split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0);
}

export function TopicFilter({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = parseIds(searchParams.get("topicIds"));
  const [open, setOpen] = useState(false);

  function navigate(ids: number[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "topic");
    if (ids.length) params.set("topicIds", ids.join(","));
    else params.delete("topicIds");
    params.delete("page");
    router.push(`/explore?${params.toString()}`);
  }

  function toggle(id: number) {
    navigate(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  const selectedTopics = topics.filter((topic) => selected.includes(topic.id));

  return (
    <div className="mt-4">
      {selectedTopics.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          {selectedTopics.map((topic) => (
            <span
              key={topic.id}
              className="inline-flex items-center gap-1.5 bg-primary text-primary-fg font-mono text-sm px-3 py-1.5 rounded-lg"
            >
              {topic.name}
              <button onClick={() => toggle(topic.id)} aria-label="제거" className="hover:opacity-70">
                ×
              </button>
            </span>
          ))}
          <button onClick={() => navigate([])} className="text-xs font-semibold text-primary">
            전체 해제
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg border border-border bg-card text-fg hover:border-primary hover:text-primary transition-colors"
      >
        <span className="text-xs">{open ? "▾" : "▸"}</span>
        토픽 선택
        <span className="font-mono text-xs text-muted">
          {selected.length > 0 ? `${selected.length}/${topics.length}` : topics.length}
        </span>
      </button>

      {open && (
        <div className="flex flex-wrap gap-2 mt-2.5">
          {topics.map((topic) => {
            const active = selected.includes(topic.id);
            return (
              <button
                key={topic.id}
                onClick={() => toggle(topic.id)}
                className={`font-mono text-sm px-3.5 py-2 rounded-lg border transition-colors ${
                  active
                    ? "bg-primary text-primary-fg border-primary"
                    : "bg-card text-fg border-border hover:border-primary hover:text-primary"
                }`}
              >
                {active ? "✓ " : ""}
                {topic.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
