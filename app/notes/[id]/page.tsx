"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { deleteNote, getNote } from "@/lib/api/notes";
import { ApiError } from "@/lib/api/client";
import type { Note } from "@/lib/types";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { NoteEditor } from "@/components/note/NoteEditor";
import { NoteMarkdown } from "@/components/note/NoteMarkdown";
import { RecommendationPanel } from "@/components/note/RecommendationPanel";
import { BackLink } from "@/components/BackLink";
import { formatDateTime } from "@/lib/format";

type Status = "loading" | "ready" | "notfound" | "error";

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    setStatus("loading");
    try {
      setNote(await getNote(token, id));
      setStatus("ready");
    } catch (caught) {
      setStatus(caught instanceof ApiError && caught.status === 404 ? "notfound" : "error");
    }
  }, [getIdToken, id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function handleDelete() {
    if (!note) return;
    if (!confirm("이 노트를 삭제할까요? 되돌릴 수 없어요.")) return;
    setDeleting(true);
    setActionError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("missing token");
      await deleteNote(token, note.id);
      router.push("/notes");
    } catch {
      setActionError("삭제에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setDeleting(false);
    }
  }

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

  if (status === "notfound" || status === "error") {
    return (
      <main className="max-w-[760px] mx-auto px-6 py-24">
        <BackLink href="/notes" label="← 내 노트로" />
        <p className="text-muted mt-6 text-center">
          {status === "notfound" ? "노트를 찾을 수 없어요." : "노트를 불러오지 못했어요."}
        </p>
      </main>
    );
  }

  if (!note) {
    return <main className="max-w-[760px] mx-auto px-6 py-24 text-center text-muted">불러오는 중…</main>;
  }

  if (editing) {
    return (
      <NoteEditor
        note={note}
        onSaved={(updated) => {
          setNote(updated);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <main className="max-w-[1180px] mx-auto px-6 py-12">
      <BackLink href="/notes" label="← 내 노트로" />
      <div className={`mt-6 ${sidebarOpen ? "flex flex-col lg:flex-row lg:items-stretch gap-6" : ""}`}>
        <div className={sidebarOpen ? "flex-1 min-w-0" : "max-w-[820px] mx-auto"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[32px] font-extrabold tracking-[-0.025em] m-0 break-words">
                {note.title}
              </h1>
              <p className="font-mono text-sm text-muted mt-2">
                {formatDateTime(note.createdAt)}
                {note.updatedAt !== note.createdAt ? ` · 수정 ${formatDateTime(note.updatedAt)}` : ""}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[9px] font-bold text-sm text-primary border border-primary/40 hover:bg-primary-soft transition-colors"
                >
                  관련 글 줍줍
                </button>
              )}
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center bg-primary text-primary-fg px-4 py-2 rounded-[9px] font-bold text-sm hover:opacity-90 transition-opacity"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 rounded-[9px] font-bold text-sm text-muted border border-border hover:text-danger hover:border-danger transition-colors disabled:opacity-60"
              >
                {deleting ? "삭제 중…" : "삭제"}
              </button>
            </div>
          </div>

          {note.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
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

          {actionError && <p className="text-sm text-danger mt-4">{actionError}</p>}

          <article className="mt-8 bg-card border border-border rounded-2xl p-7">
            <NoteMarkdown content={note.content} />
          </article>
        </div>

        {sidebarOpen && (
          <aside className="w-full lg:w-[400px] lg:shrink-0">
            <div className="lg:sticky lg:top-20">
              <RecommendationPanel
                selectedNote={note}
                onClose={() => setSidebarOpen(false)}
                onAnalyzed={(_noteId, keywords) =>
                  setNote((prev) => (prev ? { ...prev, keywords } : prev))
                }
              />
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
