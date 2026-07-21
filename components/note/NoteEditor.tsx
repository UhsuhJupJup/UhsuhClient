"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createNote, deleteNote, updateNote } from "@/lib/api/notes";
import type { Note } from "@/lib/types";
import { NoteMarkdown } from "@/components/note/NoteMarkdown";
import { SplitPane } from "@/components/note/SplitPane";
import { useMediaQuery } from "@/lib/useMediaQuery";

const MAX_TITLE = 200;
const MAX_CONTENT = 10000;

export function NoteEditor({
  note,
  onSaved,
  onCancel,
}: {
  note?: Note;
  onSaved?: (note: Note) => void;
  onCancel?: () => void;
}) {
  const { getIdToken } = useAuth();
  const router = useRouter();
  const isEdit = note !== undefined;
  const isWide = useMediaQuery("(min-width: 900px)");

  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topOffset, setTopOffset] = useState(57);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const observer = new ResizeObserver(() =>
      setTopOffset((header as HTMLElement).offsetHeight),
    );
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const titleTooLong = title.length > MAX_TITLE;
  const contentTooLong = content.length > MAX_CONTENT;
  const isDirty = title !== (note?.title ?? "") || content !== (note?.content ?? "");
  const canSave =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    !titleTooLong &&
    !contentTooLong &&
    isDirty &&
    !saving &&
    !deleting;

  async function submit() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("missing token");
      if (note) {
        const updated = await updateNote(token, note.id, title, content);
        if (onSaved) onSaved(updated);
        else router.push(`/notes/${updated.id}`);
      } else {
        const created = await createNote(token, title, content);
        router.push(`/notes/${created.id}`);
      }
    } catch {
      setError("저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!note) return;
    if (!confirm("이 노트를 삭제할까요? 되돌릴 수 없어요.")) return;
    setDeleting(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("missing token");
      await deleteNote(token, note.id);
      router.push("/notes");
    } catch {
      setError("삭제에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setDeleting(false);
    }
  }

  function cancel() {
    if (onCancel) onCancel();
    else router.push("/notes");
  }

  const editPane = (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="px-5 pt-6 md:px-8">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full border-0 bg-transparent text-[26px] font-extrabold leading-tight tracking-[-0.02em] outline-none placeholder:text-muted/40 md:text-[34px]"
        />
        <div className="my-4 h-[3px] w-20 rounded bg-primary" />
      </div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="여기에 마크다운으로 작성하세요…"
        className="min-h-0 w-full flex-1 resize-none overflow-y-auto border-0 bg-transparent px-5 pb-6 font-mono text-[15px] leading-[1.8] outline-none placeholder:text-muted/40 md:px-8"
      />
    </div>
  );

  const previewPane = (
    <div className="h-full min-h-0 overflow-y-auto bg-bg px-5 py-6 md:px-8">
      {content.trim() ? (
        <NoteMarkdown content={content} fluid />
      ) : (
        <p className="text-muted">미리볼 내용이 여기에 표시돼요.</p>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-card"
      style={{ top: topOffset }}
    >
      {!isWide && (
        <div className="flex shrink-0 items-center gap-1 border-b border-border bg-card px-4 py-2">
          <PaneTab active={tab === "write"} onClick={() => setTab("write")}>
            편집
          </PaneTab>
          <PaneTab active={tab === "preview"} onClick={() => setTab("preview")}>
            미리보기
          </PaneTab>
        </div>
      )}

      <div className="min-h-0 flex-1">
        {isWide ? (
          <SplitPane left={editPane} right={previewPane} />
        ) : (
          <div className="h-full min-h-0">{tab === "write" ? editPane : previewPane}</div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-border bg-card px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className={titleTooLong ? "text-danger" : "text-muted"}>
            제목 {title.length}/{MAX_TITLE}
          </span>
          <span className={contentTooLong ? "text-danger" : "text-muted"}>
            본문 {content.length.toLocaleString()}/{MAX_CONTENT.toLocaleString()}
          </span>
        </div>
        {error && <span className="text-sm text-danger">{error}</span>}
        <div className="ml-auto flex items-center gap-2">
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={saving || deleting}
              className="rounded-lg px-4 py-2.5 text-sm font-bold text-muted transition-colors hover:text-danger disabled:opacity-60"
            >
              {deleting ? "삭제 중…" : "삭제"}
            </button>
          )}
          <button
            onClick={cancel}
            disabled={saving || deleting}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-muted transition-colors hover:text-fg disabled:opacity-60"
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={!canSave}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-extrabold text-primary-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "저장 중…" : isEdit ? "수정하기" : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaneTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${
        active ? "bg-primary text-primary-fg" : "text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
