"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { addBookmark, removeBookmark } from "@/lib/api/archive";

export function BookmarkButton({
  articleId,
  initialBookmarked = false,
  className,
}: {
  articleId: number;
  initialBookmarked?: boolean;
  className?: string;
}) {
  const { user, getIdToken } = useAuth();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, setPending] = useState(false);

  if (!user) return null;

  async function toggle() {
    if (pending) return;
    const next = !bookmarked;
    setBookmarked(next);
    setPending(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("missing token");
      if (next) await addBookmark(token, articleId);
      else await removeBookmark(token, articleId);
    } catch {
      setBookmarked(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "별표 해제" : "별표"}
      className={`shrink-0 border-none bg-transparent p-0 text-lg leading-none cursor-pointer transition-colors disabled:opacity-60 ${
        bookmarked ? "text-primary" : "text-muted hover:text-primary"
      } ${className ?? ""}`}
    >
      {bookmarked ? "★" : "☆"}
    </button>
  );
}
