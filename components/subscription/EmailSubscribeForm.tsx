"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { registerEmailSubscription } from "@/lib/api/emailSubscriptions";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/PageHeader";
import { BackLink } from "@/components/BackLink";
import { Step } from "@/components/subscription/Step";
import { KeywordPicker } from "@/components/subscription/KeywordPicker";
import { SelectedKeywords } from "@/components/subscription/SelectedKeywords";
import type { TopicDetail } from "@/lib/types";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function EmailSubscribeForm() {
  const [email, setEmail] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<Map<number, string>>(new Map());
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManageHint, setShowManageHint] = useState(false);

  const toggleKeyword = useCallback((id: number, name: string) => {
    setSelectedKeywords((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, name);
      return next;
    });
  }, []);

  const toggleAllTopicKeywords = useCallback((topic: TopicDetail) => {
    setSelectedKeywords((prev) => {
      const next = new Map(prev);
      const allSelected = topic.keywords.length > 0 && topic.keywords.every((keyword) => next.has(keyword.id));
      if (allSelected) topic.keywords.forEach((keyword) => next.delete(keyword.id));
      else topic.keywords.forEach((keyword) => next.set(keyword.id, keyword.name));
      return next;
    });
  }, []);

  const trimmedEmail = email.trim();
  const emailValid = isValidEmail(trimmedEmail);
  const selectedCount = selectedKeywords.size;
  const canSubmit = emailValid && selectedCount > 0 && consent && !submitting;

  async function submit() {
    setSubmitting(true);
    setError(null);
    setShowManageHint(false);
    try {
      await registerEmailSubscription(trimmedEmail, [...selectedKeywords.keys()]);
      setSubmitted(true);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setShowManageHint(caught.status === 409 && caught.message.includes("구독 중"));
      } else {
        setError("등록에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div>
      <BackLink href="/explore" label="← 탐색으로" />
      <PageHeader
        eyebrow="Email Subscribe"
        title="이메일로 구독하기"
        description="로그인 없이 이메일만 등록하면 도토리 알림을 받아요 🐿️"
      />

      {submitted ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-[520px] mx-auto">
          <div className="text-4xl mb-3">📬</div>
          <h2 className="text-xl font-extrabold m-0">확인 메일을 보냈어요</h2>
          <p className="text-sm text-muted mt-3 mb-0 leading-relaxed">
            <span className="font-semibold text-fg">{trimmedEmail}</span> 로 확인 메일을 보냈어요.
            <br />
            메일함에서 링크를 눌러 구독을 완료하세요.
          </p>
          <p className="text-xs text-muted mt-4 mb-0">
            메일이 안 보이면 스팸함도 확인해 주세요. 링크는 24시간 뒤 만료돼요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="min-w-0">
            <Step number={1} title="이메일 입력">
              <label htmlFor="email-subscribe-input" className="sr-only">
                이메일
              </label>
              <input
                id="email-subscribe-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-primary"
              />
              {trimmedEmail && !emailValid && (
                <p className="text-xs text-danger mt-2">이메일 형식을 확인해 주세요.</p>
              )}
              <p className="text-sm text-muted mt-2">이 주소로 새 글 알림을 보내드려요.</p>
            </Step>

            <Step number={2} title="관심 키워드 선택">
              <KeywordPicker
                selected={selectedKeywords}
                onToggleKeyword={toggleKeyword}
                onToggleTopic={toggleAllTopicKeywords}
              />
            </Step>
          </div>

          <aside className="lg:sticky lg:top-20">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold m-0">담은 키워드</h3>
                <span className="font-mono text-xs text-muted">{selectedCount}</span>
              </div>
              <SelectedKeywords selected={selectedKeywords} onRemove={toggleKeyword} />

              <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-0.5 accent-[var(--primary)]"
                />
                <span className="text-xs text-muted leading-relaxed">
                  메일 수신에 동의합니다. 메일 하단 링크나 &lsquo;구독 관리&rsquo;에서 언제든 해지할 수 있어요.
                </span>
              </label>

              {error && (
                <div className="mt-4">
                  <p className="text-sm text-danger m-0">{error}</p>
                  {showManageHint && (
                    <Link
                      href="/subscribe/email/manage"
                      className="inline-block mt-1.5 text-sm font-semibold text-primary no-underline"
                    >
                      구독 관리로 이동 →
                    </Link>
                  )}
                </div>
              )}

              <button
                onClick={submit}
                disabled={!canSubmit}
                className="w-full mt-5 bg-primary text-primary-fg py-3.5 rounded-xl font-extrabold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "보내는 중…" : "확인 메일 받기"}
              </button>

              <p className="text-center text-xs text-muted mt-3">
                이미 구독 중이신가요?{" "}
                <Link href="/subscribe/email/manage" className="text-primary font-semibold no-underline">
                  구독 관리
                </Link>
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
