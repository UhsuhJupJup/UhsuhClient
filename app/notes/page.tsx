"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getNotes } from "@/lib/api/notes";
import type { Note } from "@/lib/types";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { RecommendationPanel } from "@/components/note/RecommendationPanel";
import { PageHeader } from "@/components/PageHeader";
import { formatDateTime } from "@/lib/format";
import { stripMarkdown } from "@/lib/markdown";

export default function NotesPage() {
  const { user, loading, getIdToken } = useAuth();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const closeWorkspace = useCallback(() => {
    setWorkspaceOpen(false);
    setSelectedId(null);
  }, []);

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

  const selectedNote = notes?.find((note) => note.id === selectedId) ?? null;
  const hasNotes = notes !== null && notes.length > 0;

  return (
    <main className="max-w-[1180px] mx-auto px-6 py-12">
      <PageHeader
        eyebrow="Notes"
        title="내 노트"
        description="학습한 내용을 기록하고 모아보세요."
        action={
          <Link
            href="/notes/new"
            className="inline-flex items-center bg-primary text-primary-fg px-4 py-2 rounded-[9px] font-bold text-sm no-underline hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            + 새 노트
          </Link>
        }
      />

      <div className="flex flex-col lg:flex-row lg:items-stretch gap-6">
        <div className="flex-1 min-w-0">
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
                const inner = (
                  <>
                    <h2 className="text-lg font-bold m-0 break-words line-clamp-1">{note.title}</h2>
                    {preview && (
                      <p className="text-sm text-muted leading-relaxed mt-1.5 mb-0 line-clamp-2">{preview}</p>
                    )}
                    <p className="font-mono text-xs text-muted mt-3 mb-0">{formatDateTime(note.createdAt)}</p>
                    {note.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {note.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="font-mono text-xs text-muted bg-chip-bg px-2 py-1 rounded-md"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                );
                return workspaceOpen ? (
                  <button
                    key={note.id}
                    onClick={() => setSelectedId(note.id)}
                    className={`text-left bg-card border rounded-2xl p-5 transition-colors ${
                      selectedId === note.id
                        ? "border-primary ring-1 ring-primary"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {inner}
                  </button>
                ) : (
                  <div
                    key={note.id}
                    className="bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors"
                  >
                    <Link href={`/notes/${note.id}`} className="block no-underline text-fg">
                      {inner}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {hasNotes && (
          <aside
            className={`w-full transition-[width] duration-300 ${
              workspaceOpen ? "lg:w-[520px]" : "lg:w-[240px]"
            } lg:shrink-0`}
          >
            <div className="lg:sticky lg:top-20">
              {workspaceOpen ? (
                <RecommendationPanel
                  selectedNote={selectedNote}
                  onClose={closeWorkspace}
                  onAnalyzed={(noteId, keywords) =>
                    setNotes((prev) =>
                      prev ? prev.map((note) => (note.id === noteId ? { ...note, keywords } : note)) : prev,
                    )
                  }
                />
              ) : (
                <div className="w-full bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-base font-extrabold text-fg">관련 글 줍줍</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-acorn bg-acorn-soft px-1.5 py-0.5 rounded">
                      AI
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center py-10 gap-4">
                    <Image src="/mascot-icon.png" alt="" width={88} height={88} className="opacity-90" />
                    <button
                      onClick={() => setWorkspaceOpen(true)}
                      className="inline-flex items-center gap-1.5 bg-primary text-primary-fg px-4 py-2 rounded-[9px] font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                      줍줍 시작하기 →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
