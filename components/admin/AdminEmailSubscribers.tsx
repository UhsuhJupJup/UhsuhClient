"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getEmailSubscribers } from "@/lib/api/admin";
import { formatDate } from "@/lib/format";
import type { AdminEmailSubscriber, EmailRecipientType } from "@/lib/types";

const headClass = "text-left font-semibold px-5 py-3 whitespace-nowrap";

const recipientStyle: Record<EmailRecipientType, string> = {
  MEMBER: "bg-primary-soft text-primary",
  EMAIL_SUBSCRIBER: "bg-chip-bg text-fg",
};

const recipientLabel: Record<EmailRecipientType, string> = {
  MEMBER: "회원",
  EMAIL_SUBSCRIBER: "비회원",
};

const KEYWORD_LIMIT = 6;

function SubscriberKeywords({ keywords }: { keywords: string[] }) {
  const [expanded, setExpanded] = useState(false);

  if (keywords.length === 0) {
    return <span className="text-xs text-muted">–</span>;
  }

  const shown = expanded ? keywords : keywords.slice(0, KEYWORD_LIMIT);
  const hiddenCount = keywords.length - KEYWORD_LIMIT;

  return (
    <div className="flex flex-wrap gap-1.5 max-w-[420px]">
      {shown.map((keyword) => (
        <span
          key={keyword}
          className="inline-flex items-center bg-chip-bg text-fg font-mono text-xs px-2.5 py-1 rounded-full"
        >
          {keyword}
        </span>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center text-xs font-semibold text-primary px-2.5 py-1 rounded-full hover:bg-primary-soft transition-colors"
        >
          {expanded ? "접기" : `+${hiddenCount} 더보기`}
        </button>
      )}
    </div>
  );
}

export function AdminEmailSubscribers() {
  const { user, getIdToken } = useAuth();
  const [subscribers, setSubscribers] = useState<AdminEmailSubscriber[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getIdToken();
      if (!token) return;
      setError(false);
      setSubscribers(await getEmailSubscribers(token));
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
        이메일 구독자를 불러오지 못했어요.
      </div>
    );
  }

  if (subscribers === null) {
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-10 text-center text-sm text-muted">
        불러오는 중…
      </div>
    );
  }

  if (subscribers.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl px-5 py-16 text-center text-sm text-muted">
        아직 구독 중인 이메일이 없어요.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-muted border-b border-border">
              <th className={headClass}>이메일</th>
              <th className={headClass}>유형</th>
              <th className={headClass}>인증</th>
              <th className={`${headClass} whitespace-normal`}>구독 키워드</th>
              <th className={headClass}>등록일</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((subscriber) => (
              <tr
                key={`${subscriber.recipientType}-${subscriber.id}`}
                className="border-b border-border last:border-0 align-top"
              >
                <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">{subscriber.email}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${recipientStyle[subscriber.recipientType]}`}
                  >
                    {recipientLabel[subscriber.recipientType]}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      subscriber.verified ? "bg-primary-soft text-primary" : "bg-chip-bg text-muted"
                    }`}
                  >
                    {subscriber.verified ? "인증됨" : "미인증"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <SubscriberKeywords keywords={subscriber.keywords} />
                </td>
                <td className="px-5 py-4 font-mono text-xs text-muted whitespace-nowrap">
                  {formatDate(subscriber.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
