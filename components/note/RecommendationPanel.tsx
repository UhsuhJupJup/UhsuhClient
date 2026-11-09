"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getRecommendations, retryRecommendations } from "@/lib/api/notes";
import type { Note, NoteRecommendation } from "@/lib/types";
import { RecommendationResult } from "@/components/note/RecommendationResult";

type Status = "idle" | "loading" | "pending" | "stalled" | "ready" | "failed" | "error";

const POLL_DELAYS_MS = [3000, 5000, 8000, 13000, 15000];
const POLL_LIMIT_MS = 10 * 60 * 1000;

type RecommendationPanelProps = {
  selectedNote: Note | null;
  onClose?: () => void;
  onNoteUpdate?: (noteId: number, patch: Partial<Note>) => void;
};

export function RecommendationPanel(props: RecommendationPanelProps) {
  return <NoteRecommendationPanel key={props.selectedNote?.id ?? "none"} {...props} />;
}

function initialStatus(note: Note | null): Status {
  if (note?.analysisStatus === "PENDING") return "pending";
  if (note?.analysisStatus === "FAILED") return "failed";
  return "idle";
}

function NoteRecommendationPanel({ selectedNote, onClose, onNoteUpdate }: RecommendationPanelProps) {
  const { getIdToken } = useAuth();
  const [status, setStatus] = useState<Status>(() => initialStatus(selectedNote));
  const [data, setData] = useState<NoteRecommendation | null>(null);
  const [pollRound, setPollRound] = useState(0);
  const onNoteUpdateRef = useRef(onNoteUpdate);
  const active = useRef(true);
  const selectedId = selectedNote?.id ?? null;

  useEffect(() => {
    onNoteUpdateRef.current = onNoteUpdate;
  });

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const apply = useCallback((noteId: number, result: NoteRecommendation) => {
    if (result.status === "PENDING") {
      setStatus("pending");
      onNoteUpdateRef.current?.(noteId, { analysisStatus: "PENDING" });
      return;
    }
    if (result.status === "FAILED") {
      setStatus("failed");
      onNoteUpdateRef.current?.(noteId, { analysisStatus: "FAILED" });
      return;
    }
    setData(result);
    setStatus("ready");
    onNoteUpdateRef.current?.(noteId, {
      keywords: result.keywords,
      analysisStatus: "ANALYZED",
      recommendationReady: false,
    });
  }, []);

  const jubjub = async (retry = false) => {
    if (selectedId == null) return;
    setStatus("loading");
    setData(null);
    try {
      const token = await getIdToken();
      if (!active.current) return;
      if (!token) {
        setStatus("error");
        return;
      }
      if (retry) await retryRecommendations(token, selectedId);
      const result = await getRecommendations(token, selectedId);
      if (!active.current) return;
      setPollRound((round) => round + 1);
      apply(selectedId, result);
    } catch {
      if (active.current) setStatus("error");
    }
  };

  useEffect(() => {
    if (status !== "pending" || selectedId == null) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const token = await getIdToken();
        if (cancelled) return;
        if (!token) {
          setStatus("error");
          return;
        }
        const result = await getRecommendations(token, selectedId);
        if (cancelled) return;
        if (result.status !== "PENDING") {
          apply(selectedId, result);
          return;
        }
        schedule();
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    const schedule = () => {
      if (Date.now() - startedAt >= POLL_LIMIT_MS) {
        setStatus("stalled");
        return;
      }
      const delay = POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)];
      attempt += 1;
      timer = setTimeout(poll, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [status, selectedId, pollRound, getIdToken, apply]);

  const busy = status === "loading" || status === "pending";

  return (
    <div className="bg-card border border-border rounded-2xl p-5 lg:max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold m-0">관련 글 줍줍</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider text-acorn bg-acorn-soft px-1.5 py-0.5 rounded">
            AI
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="닫기"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-muted hover:bg-chip-bg hover:text-fg transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex justify-center pt-1 pb-4">
        <Image src="/mascot-icon.png" alt="" width={88} height={88} className="opacity-90" />
      </div>

      {!selectedNote ? (
        <p className="text-sm text-muted text-center">노트를 고르면 관련 글을 주워올게요.</p>
      ) : (
        <>
          <div className="border border-border rounded-xl p-3 bg-surface">
            <p className="font-semibold text-sm text-fg m-0 line-clamp-2">{selectedNote.title}</p>
          </div>
          <button
            onClick={() => {
              void jubjub();
            }}
            disabled={busy}
            className="mt-3 w-full inline-flex items-center justify-center bg-primary text-primary-fg px-4 py-2 rounded-[9px] font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {status === "loading" ? "줍줍하는 중…" : status === "pending" ? "분석하는 중…" : "줍줍하기"}
          </button>

          {status === "idle" && selectedNote.recommendationReady && (
            <p role="status" className="mt-4 text-sm text-primary font-semibold">
              추천 글이 준비됐어요. 줍줍하기를 눌러 확인해 보세요.
            </p>
          )}

          {status === "loading" && (
            <div className="mt-5 flex flex-col gap-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2 py-3">
                  <div className="h-3.5 w-full bg-skeleton rounded" />
                  <div className="h-2.5 w-24 bg-skeleton rounded" />
                </div>
              ))}
            </div>
          )}

          {status === "pending" && (
            <div role="status" className="mt-5 flex flex-col gap-1">
              <p className="text-sm text-fg font-semibold m-0">AI 분석을 기다리고 있어요.</p>
              <p className="text-sm text-muted m-0">
                요청은 저장돼 있어요. 분석이 끝나면 이 화면에 보여드리고, 다른 화면으로 가도 노트 목록에 표시돼요.
              </p>
            </div>
          )}

          {status === "stalled" && (
            <div role="status" className="mt-5 flex flex-col gap-2">
              <p className="text-sm text-muted m-0">
                분석이 오래 걸리고 있어요. 끝나면 노트 목록에 표시돼요.
              </p>
              <button
                onClick={() => {
                  void jubjub();
                }}
                className="self-start text-sm font-semibold text-primary hover:opacity-80"
              >
                다시 확인
              </button>
            </div>
          )}

          {status === "failed" && (
            <div role="alert" className="mt-5 flex items-center gap-3">
              <p className="text-sm text-muted m-0">분석을 끝내지 못했어요.</p>
              <button
                onClick={() => {
                  void jubjub(true);
                }}
                className="text-sm font-semibold text-primary hover:opacity-80"
              >
                다시 맡기기
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="mt-5 flex items-center gap-3">
              <p className="text-sm text-muted m-0">불러오지 못했어요.</p>
              <button
                onClick={() => {
                  void jubjub();
                }}
                className="text-sm font-semibold text-primary hover:opacity-80"
              >
                다시 시도
              </button>
            </div>
          )}

          {status === "ready" && data && (
            <div className="mt-5">
              {data.keywords.length === 0 ? (
                <p className="text-sm text-muted">이 노트에서 키워드를 추출하지 못했어요.</p>
              ) : (
                <RecommendationResult noteId={selectedNote.id} recommendation={data} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
