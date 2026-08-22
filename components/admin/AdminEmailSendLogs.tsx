"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getEmailSendLogs } from "@/lib/api/admin";
import { formatDateTime } from "@/lib/format";
import type { EmailRecipientType, EmailSendLog } from "@/lib/types";

const recipientStyle: Record<EmailRecipientType, string> = {
  MEMBER: "bg-primary-soft text-primary",
  EMAIL_SUBSCRIBER: "bg-chip-bg text-fg",
};

const recipientLabel: Record<EmailRecipientType, string> = {
  MEMBER: "회원",
  EMAIL_SUBSCRIBER: "비회원",
};

const headClass = "text-left font-semibold px-5 py-3 whitespace-nowrap";

export function AdminEmailSendLogs() {
  const { user, getIdToken } = useAuth();
  const [logs, setLogs] = useState<EmailSendLog[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;
      setError(false);
      setLogs(await getEmailSendLogs(token, 50));
    } catch {
      setError(true);
    }
  }, [getIdToken]);

  useEffect(() => {
    void load();
  }, [user, load]);

  if (error) {
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm text-danger">
        발송 로그를 불러오지 못했어요.
      </div>
    );
  }

  if (logs === null) {
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm text-muted">
        불러오는 중…
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-16 text-center text-sm text-muted">
        아직 발송 로그가 없어요.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-muted border-b border-border">
              <th className={headClass}>발송 시각</th>
              <th className={headClass}>이메일</th>
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
                <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">{log.articleCount}</td>
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
  );
}
