"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getRuns } from "@/lib/api/admin";
import { formatDateTime, formatDuration, formatTime } from "@/lib/format";
import type { PipelineRun, PipelineRunStatus } from "@/lib/types";

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

const headClass = "text-left font-semibold px-5 py-3 whitespace-nowrap";

export function AdminRuns() {
  const { user, getIdToken } = useAuth();
  const [runs, setRuns] = useState<PipelineRun[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const data = await getRuns(token);
        if (active) setRuns(data);
      } catch {
        if (active) setError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, getIdToken]);

  if (error) {
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm text-danger">
        실행 이력을 불러오지 못했어요.
      </div>
    );
  }

  if (runs === null) {
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm text-muted">
        불러오는 중…
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-16 text-center text-sm text-muted">
        아직 실행 이력이 없어요.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-muted border-b border-border">
              <th className={headClass}>실행 일시</th>
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
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle[run.status]}`}>
                    {statusLabel[run.status]}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                  <span className="text-fg">{run.collectedNew}</span>
                  <span className="text-muted">/{run.collectedTotal}</span>
                  {run.collectFailed > 0 && (
                    <span className="text-danger"> · 실패 {run.collectFailed}</span>
                  )}
                </td>
                <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                  글 {run.matchedArticles} · 태그 {run.tagsCreated}
                </td>
                <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                  회원 {run.membersNotified} · 기록 {run.notificationsRecorded}
                  {run.notifyFailed > 0 && (
                    <span className="text-danger"> · 실패 {run.notifyFailed}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
