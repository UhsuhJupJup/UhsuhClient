"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getEmailSendLogDaily, getEmailSendLogsByDate } from "@/lib/api/admin";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";
import type { EmailRecipientType, EmailSendLog, EmailSendLogDaily } from "@/lib/types";

const recipientStyle: Record<EmailRecipientType, string> = {
  MEMBER: "bg-primary-soft text-primary",
  EMAIL_SUBSCRIBER: "bg-chip-bg text-fg",
};

const recipientLabel: Record<EmailRecipientType, string> = {
  MEMBER: "회원",
  EMAIL_SUBSCRIBER: "비회원",
};

const headClass = "text-left font-semibold px-5 py-3 whitespace-nowrap";

function StatusCard({ tone, children }: { tone: "muted" | "danger"; children: React.ReactNode }) {
  return (
    <div
      className={`bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm ${
        tone === "danger" ? "text-danger" : "text-muted"
      }`}
    >
      {children}
    </div>
  );
}

function DailyView({ onSelect }: { onSelect: (date: string) => void }) {
  const { user, getIdToken } = useAuth();
  const [rows, setRows] = useState<EmailSendLogDaily[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;
      setError(false);
      setRows(await getEmailSendLogDaily(token));
    } catch {
      setError(true);
    }
  }, [getIdToken]);

  useEffect(() => {
    void load();
  }, [user, load]);

  if (error) return <StatusCard tone="danger">발송 로그를 불러오지 못했어요.</StatusCard>;
  if (rows === null) return <StatusCard tone="muted">불러오는 중…</StatusCard>;
  if (rows.length === 0)
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-16 text-center text-sm text-muted">
        아직 발송 로그가 없어요.
      </div>
    );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-muted border-b border-border">
              <th className={headClass}>날짜</th>
              <th className={headClass}>발송 시각</th>
              <th className={headClass}>보낸 횟수</th>
              <th className={headClass}>회원</th>
              <th className={headClass}>비회원</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.date}
                onClick={() => onSelect(row.date)}
                className="border-b border-border last:border-0 align-top cursor-pointer hover:bg-chip-bg transition-colors"
              >
                <td className="px-5 py-4 font-medium whitespace-nowrap">{formatDate(row.date)}</td>
                <td className="px-5 py-4 font-mono text-xs text-muted whitespace-nowrap">
                  {formatTime(row.sentAt)}
                </td>
                <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">{row.total}</td>
                <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">{row.memberCount}</td>
                <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                  {row.subscriberCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailView({ date, onBack }: { date: string; onBack: () => void }) {
  const { user, getIdToken } = useAuth();
  const [logs, setLogs] = useState<EmailSendLog[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;
      setError(false);
      setLogs(await getEmailSendLogsByDate(token, date));
    } catch {
      setError(true);
    }
  }, [getIdToken, date]);

  useEffect(() => {
    void load();
  }, [user, load]);

  const back = (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
    >
      ← 날짜 목록
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {back}
        <span className="text-sm font-bold text-fg">{formatDate(date)}</span>
      </div>

      {error ? (
        <StatusCard tone="danger">발송 로그를 불러오지 못했어요.</StatusCard>
      ) : logs === null ? (
        <StatusCard tone="muted">불러오는 중…</StatusCard>
      ) : logs.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl px-5 py-16 text-center text-sm text-muted">
          이 날짜의 발송 내역이 없어요.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className={headClass}>발송 시각</th>
                  <th className={headClass}>메일</th>
                  <th className={headClass}>수신자</th>
                  <th className={headClass}>글 수</th>
                  <th className={`${headClass} whitespace-normal`}>제목</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-5 py-4 font-medium whitespace-nowrap">
                      {formatDateTime(log.sentAt)}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">{log.email}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${recipientStyle[log.recipientType]}`}
                      >
                        {recipientLabel[log.recipientType]}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                      {log.articleCount}
                    </td>
                    <td className="px-5 py-4">
                      <span className="block max-w-[360px] truncate text-fg" title={log.subject}>
                        {log.subject}
                      </span>
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

export function AdminEmailSendLogs() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return selectedDate === null ? (
    <DailyView onSelect={setSelectedDate} />
  ) : (
    <DetailView date={selectedDate} onBack={() => setSelectedDate(null)} />
  );
}
