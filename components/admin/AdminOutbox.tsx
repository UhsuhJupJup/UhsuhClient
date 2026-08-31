"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getOutbox, requeueOutbox } from "@/lib/api/admin";
import { formatDateTime } from "@/lib/format";
import type { AdminOutbox as AdminOutboxData, EmailRecipientType } from "@/lib/types";

const recipientStyle: Record<EmailRecipientType, string> = {
  MEMBER: "bg-primary-soft text-primary",
  EMAIL_SUBSCRIBER: "bg-chip-bg text-fg",
};

const recipientLabel: Record<EmailRecipientType, string> = {
  MEMBER: "회원",
  EMAIL_SUBSCRIBER: "비회원",
};

const headClass = "text-left font-semibold px-5 py-3 whitespace-nowrap";

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-6 text-center">
      <div className={`text-3xl font-extrabold ${tone}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

export function AdminOutbox() {
  const { user, getIdToken } = useAuth();
  const [data, setData] = useState<AdminOutboxData | null>(null);
  const [error, setError] = useState(false);
  const [requeuing, setRequeuing] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;
      setError(false);
      setData(await getOutbox(token, 50));
    } catch {
      setError(true);
    }
  }, [getIdToken]);

  useEffect(() => {
    void load();
  }, [user, load]);

  const handleRequeue = useCallback(
    async (id: number) => {
      try {
        const token = await getIdToken();
        if (!token) return;
        setRequeuing(id);
        await requeueOutbox(token, id);
        await load();
      } catch {
        setError(true);
      } finally {
        setRequeuing(null);
      }
    },
    [getIdToken, load],
  );

  if (error) {
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm text-danger">
        아웃박스 현황을 불러오지 못했어요.
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm text-muted">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="대기" value={data.pending} tone="text-fg" />
        <StatCard label="발송 완료" value={data.sent} tone="text-primary" />
        <StatCard label="실패" value={data.failed} tone={data.failed > 0 ? "text-danger" : "text-fg"} />
      </div>

      {data.failedEntries.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm text-muted">
          실패한 발송이 없어요.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className={headClass}>적재 시각</th>
                  <th className={headClass}>수신자</th>
                  <th className={`${headClass} whitespace-normal`}>제목</th>
                  <th className={headClass}>시도</th>
                  <th className={`${headClass} whitespace-normal`}>마지막 오류</th>
                  <th className={headClass} aria-label="동작" />
                </tr>
              </thead>
              <tbody>
                {data.failedEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-5 py-4 font-medium whitespace-nowrap">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs">{entry.recipient}</span>
                      <span
                        className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${recipientStyle[entry.recipientType]}`}
                      >
                        {recipientLabel[entry.recipientType]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block max-w-[280px] truncate text-fg" title={entry.subject}>
                        {entry.subject}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">{entry.attempts}</td>
                    <td className="px-5 py-4">
                      <span
                        className="block max-w-[280px] truncate text-danger"
                        title={entry.lastError ?? ""}
                      >
                        {entry.lastError ?? "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleRequeue(entry.id)}
                        disabled={requeuing === entry.id}
                        className="inline-flex items-center bg-primary text-primary-fg px-3 py-1.5 rounded-lg font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {requeuing === entry.id ? "재시도 중…" : "재시도"}
                      </button>
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
