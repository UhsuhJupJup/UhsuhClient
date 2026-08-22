"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getEmailSubscriptions,
  requestEmailManageLink,
  updateEmailSubscriptions,
} from "@/lib/api/emailSubscriptions";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/PageHeader";
import { BackLink } from "@/components/BackLink";
import { Step } from "@/components/subscription/Step";
import { KeywordPicker } from "@/components/subscription/KeywordPicker";
import { SelectedKeywords } from "@/components/subscription/SelectedKeywords";
import { sameIds } from "@/components/subscription/selection";
import type { TopicDetail } from "@/lib/types";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function EmailManageForm({ token }: { token?: string }) {
  if (token) return <ManageEdit token={token} />;
  return <ManageLinkRequest />;
}

function ManageLinkRequest() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedEmail = email.trim();
  const emailValid = isValidEmail(trimmedEmail);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await requestEmailManageLink(trimmedEmail);
      setRequested(true);
    } catch {
      setError("요청에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[460px] mx-auto">
      <BackLink href="/subscribe/email" label="← 이메일 구독으로" />
      <PageHeader eyebrow="Manage" title="구독 관리" description="관리 링크를 이메일로 보내드려요." />

      {requested ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">✉️</div>
          <h2 className="text-xl font-extrabold m-0">메일을 확인해 주세요</h2>
          <p className="text-sm text-muted mt-3 mb-0 leading-relaxed">
            구독 중인 이메일이라면 관리 링크를 보냈어요.
            <br />
            메일함에서 링크를 눌러 키워드를 바꿔보세요.
          </p>
          <p className="text-xs text-muted mt-4 mb-0">링크는 30분 뒤 만료돼요.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6">
          <label htmlFor="manage-email-input" className="block text-sm font-semibold mb-2">
            구독한 이메일
          </label>
          <input
            id="manage-email-input"
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
          {error && <p className="text-sm text-danger mt-3">{error}</p>}
          <button
            onClick={submit}
            disabled={!emailValid || submitting}
            className="w-full mt-4 bg-primary text-primary-fg py-3.5 rounded-xl font-extrabold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "보내는 중…" : "관리 링크 받기"}
          </button>
          <p className="text-center text-xs text-muted mt-3">
            아직 구독 전이신가요?{" "}
            <Link href="/subscribe/email" className="text-primary font-semibold no-underline">
              이메일로 구독하기
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

function ManageEdit({ token }: { token: string }) {
  const [email, setEmail] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const initialKeywordIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    getEmailSubscriptions(token)
      .then((data) => {
        if (!active) return;
        setEmail(data.email);
        setSelectedKeywords(new Map(data.keywords.map((keyword) => [keyword.id, keyword.name])));
        initialKeywordIds.current = new Set(data.keywords.map((keyword) => keyword.id));
      })
      .catch((caught) => {
        if (!active) return;
        setLoadError(caught instanceof ApiError ? caught.message : "구독 정보를 불러오지 못했어요.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const toggleKeyword = useCallback((id: number, name: string) => {
    setSaved(false);
    setSelectedKeywords((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, name);
      return next;
    });
  }, []);

  const toggleAllTopicKeywords = useCallback((topic: TopicDetail) => {
    setSaved(false);
    setSelectedKeywords((prev) => {
      const next = new Map(prev);
      const allSelected = topic.keywords.length > 0 && topic.keywords.every((keyword) => next.has(keyword.id));
      if (allSelected) topic.keywords.forEach((keyword) => next.delete(keyword.id));
      else topic.keywords.forEach((keyword) => next.set(keyword.id, keyword.name));
      return next;
    });
  }, []);

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      await updateEmailSubscriptions(token, [...selectedKeywords.keys()]);
      initialKeywordIds.current = new Set(selectedKeywords.keys());
      setSaved(true);
    } catch (caught) {
      setSaveError(caught instanceof ApiError ? caught.message : "저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = selectedKeywords.size;
  const isDirty = !sameIds(selectedKeywords, initialKeywordIds.current);

  if (loading) {
    return <p className="text-muted py-20 text-center">불러오는 중…</p>;
  }

  if (loadError) {
    return (
      <div className="max-w-[460px] mx-auto">
        <PageHeader eyebrow="Manage" title="구독 관리" />
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🍂</div>
          <h2 className="text-lg font-bold m-0">{loadError}</h2>
          <p className="text-sm text-muted mt-3 mb-6">관리 링크를 다시 요청하거나 새로 구독해 주세요.</p>
          <div className="flex flex-col gap-2">
            <Link
              href="/subscribe/email/manage"
              className="bg-primary text-primary-fg py-3 rounded-xl font-bold text-sm no-underline"
            >
              관리 링크 다시 받기
            </Link>
            <Link
              href="/subscribe/email"
              className="text-sm font-semibold text-muted no-underline hover:text-primary"
            >
              이메일로 새로 구독하기 →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackLink href="/subscribe/email" label="← 이메일 구독으로" />
      <PageHeader eyebrow="Manage" title="구독 관리" description="구독 중인 키워드를 바꾸고 저장하세요." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="min-w-0">
          <Step number={1} title="받을 메일">
            <input
              value={email}
              readOnly
              className="w-full bg-chip-bg border border-border rounded-xl px-4 py-3 text-base text-muted"
            />
            <p className="text-sm text-muted mt-2">이 주소로 알림을 보내드려요.</p>
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

            {saved && !isDirty && <p className="text-sm font-semibold text-primary mt-4">저장됐어요! 🐿️</p>}
            {saveError && <p className="text-sm text-danger mt-4">{saveError}</p>}

            <button
              onClick={save}
              disabled={selectedCount === 0 || !isDirty || saving}
              className="w-full mt-5 bg-primary text-primary-fg py-3.5 rounded-xl font-extrabold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "저장 중…" : "저장하기"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
