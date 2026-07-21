"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getNotes } from "@/lib/api/notes";
import type { Note } from "@/lib/types";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { formatDateTime } from "@/lib/format";
import { stripMarkdown } from "@/lib/markdown";

export default function NotesPage() {
  const { user, loading, getIdToken } = useAuth();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    try {
      setError(false);
      setNotes(await getNotes(token));
    } catch {
      setError(true);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading) {
    return <main className="max-w-[760px] mx-auto px-6 py-24 text-center text-muted">불러오는 중…</main>;
  }

  if (!user) {
    return (
      <main className="max-w-[460px] mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-[22px] p-9">
          <LoginPanel />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[760px] mx-auto px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-extrabold tracking-[-0.025em] m-0">내 노트</h1>
          <p className="text-base text-muted mt-2">학습한 내용을 기록하고 모아보세요.</p>
        </div>
        <Link
          href="/notes/new"
          className="inline-flex items-center bg-primary text-primary-fg px-4 py-2 rounded-[9px] font-bold text-sm no-underline hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          + 새 노트
        </Link>
      </div>

      <div className="mt-8">
        {error ? (
          <p className="text-muted">노트를 불러오지 못했어요.</p>
        ) : notes === null ? (
          <p className="text-muted">불러오는 중…</p>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-3 py-16 bg-card border border-border rounded-2xl">
            <p className="text-sm text-muted m-0">아직 작성한 노트가 없어요.</p>
            <Link href="/notes/new" className="text-sm font-semibold text-primary no-underline">
              첫 노트 작성하기 →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map((note) => {
              const preview = stripMarkdown(note.content);
              return (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="block bg-card border border-border rounded-2xl p-5 no-underline text-fg hover:border-primary transition-colors"
                >
                  <h2 className="text-lg font-bold m-0 break-words line-clamp-1">{note.title}</h2>
                  {preview && (
                    <p className="text-sm text-muted leading-relaxed mt-1.5 mb-0 line-clamp-2">
                      {preview}
                    </p>
                  )}
                  <p className="font-mono text-xs text-muted mt-3 mb-0">
                    {formatDateTime(note.createdAt)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
