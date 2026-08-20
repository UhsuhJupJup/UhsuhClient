"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getRuns, triggerNotification } from "@/lib/api/admin";
import { formatDateTime, formatDuration, formatTime } from "@/lib/format";
import type { PipelineRun, PipelineRunStatus, PipelineRunKind } from "@/lib/types";

const statusStyle: Record<PipelineRunStatus, string> = {
  SUCCESS: "bg-primary-soft text-primary",
  PARTIAL: "bg-accent text-accent-ink",
  FAILED: "bg-danger-soft text-danger",
};

const statusLabel: Record<PipelineRunStatus, string> = {
  SUCCESS: "성공",
  PARTIAL: "부분 성공",
  FAILED: "실패",
};

const kindStyle: Record<PipelineRunKind, string> = {
  INGEST: "bg-chip-bg text-fg",
  NOTIFICATION: "bg-primary-soft text-primary",
};

const kindLabel: Record<PipelineRunKind, string> = {
  INGEST: "수집·매칭",
  NOTIFICATION: "알림",
};

const headClass = "text-left font-semibold px-5 py-3 whitespace-nowrap";

type Notice = { kind: "ok" | "warn" | "err"; text: string };

export function AdminRuns() {
  const { user, getIdToken } = useAuth();
  const [runs, setRuns] = useState<PipelineRun[] | null>(null);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;
      setError(false);
      setRuns(await getRuns(token));
    } catch {
      setError(true);
    }
  }, [getIdToken]);

  useEffect(() => {
    void load();
  }, [user, load]);

  const handleTrigger = useCallback(async () => {
    if (!confirm("지금 대기 중인 알림을 실제로 발송할까요? 구독자에게 메일이 나갑니다.")) return;
    setSending(true);
    setNotice(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("missing token");
      const result = await triggerNotification(token);
      if (!result) {
        setNotice({ kind: "warn", text: "다른 실행이 진행 중이라 건너뛰었어요." });
      } else if (result.membersNotified === 0) {
        setNotice({ kind: "warn", text: "지금 보낼 대기 알림이 없어요." });
      } else {
        setNotice({
          kind: "ok",
          text:
            `발송 완료 · 회원 ${result.membersNotified} · 기록 ${result.notificationsRecorded}` +
            (result.failedMembers > 0 ? ` · 실패 ${result.failedMembers}` : ""),
        });
      }
      await load();
    } catch {
      setNotice({ kind: "err", text: "발송 요청에 실패했어요. 잠시 후 다시 시도해 주세요." });
    } finally {
      setSending(false);
    }
  }, [getIdToken, load]);

  const noticeColor =
    notice?.kind === "ok" ? "text-primary" : notice?.kind === "err" ? "text-danger" : "text-muted";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className={`text-sm font-medium m-0 min-h-[20px] ${noticeColor}`}>{notice?.text ?? ""}</p>
        <button
          onClick={handleTrigger}
          disabled={sending}
          className="inline-flex items-center bg-primary text-primary-fg px-4 py-2 rounded-[9px] font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 whitespace-nowrap"
        >
          {sending ? "발송 중…" : "알림 지금 발송"}
        </button>
      </div>

      {error ? (
        <div className="bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm text-danger">
          실행 이력을 불러오지 못했어요.
        </div>
      ) : runs === null ? (
        <div className="bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm text-muted">
          불러오는 중…
        </div>
      ) : runs.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl px-5 py-16 text-center text-sm text-muted">
          아직 실행 이력이 없어요.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className={headClass}>실행 일시</th>
                  <th className={headClass}>종류</th>
                  <th className={headClass}>상태</th>
                  <th className={headClass}>수집 (신규/전체)</th>
                  <th className={headClass}>매칭 (글·태그)</th>
                  <th className={headClass}>발송 (회원·기록)</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-5 py-4">
                      <div className="font-medium whitespace-nowrap">{formatDateTime(run.startedAt)}</div>
                      <div className="font-mono text-xs text-muted mt-0.5 whitespace-nowrap">
                        → {formatTime(run.finishedAt)} · {formatDuration(run.durationSeconds)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${kindStyle[run.kind]}`}>
                        {kindLabel[run.kind]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle[run.status]}`}>
                        {statusLabel[run.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                      {run.kind === "INGEST" ? (
                        <>
                          <span className="text-fg">{run.collectedNew}</span>
                          <span className="text-muted">/{run.collectedTotal}</span>
                          {run.collectFailed > 0 && (
                            <span className="text-danger"> · 실패 {run.collectFailed}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                      {run.kind === "INGEST" ? (
                        <>글 {run.matchedArticles} · 태그 {run.tagsCreated}</>
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                      {run.kind === "NOTIFICATION" ? (
                        <>
                          회원 {run.membersNotified} · 기록 {run.notificationsRecorded}
                          {run.notifyFailed > 0 && (
                            <span className="text-danger"> · 실패 {run.notifyFailed}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
