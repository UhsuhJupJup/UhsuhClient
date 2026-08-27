"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Logo } from "@/components/Logo";

export function LoginPanel({
  onDone,
  title = "로그인하고 시작하세요",
  description = "로그인하면 내가 작성한 노트와 연관된 기술 블로그 글을 추천받을 수 있어요",
}: {
  onDone?: () => void;
  title?: string;
  description?: string;
}) {
  const { loginWithGoogle, configured } = useAuth();
  const [error, setError] = useState<string | null>(null);

  async function run(login: () => Promise<void>) {
    setError(null);
    try {
      await login();
      onDone?.();
    } catch {
      setError("로그인에 실패했어요. 다시 시도해 주세요.");
    }
  }

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center mb-5">
        <Logo size={72} />
      </div>
      <h1 className="text-2xl font-extrabold m-0">{title}</h1>
      <p className="text-base text-muted mt-3 mb-7 max-w-[360px] mx-auto leading-relaxed">
        {description}
      </p>

      {!configured && (
        <p className="text-sm text-danger mb-4">
          Firebase 설정이 필요해요 (.env.local의 NEXT_PUBLIC_FIREBASE_* 값).
        </p>
      )}
      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <div className="flex flex-col gap-3">
        <button
          onClick={() => run(loginWithGoogle)}
          disabled={!configured}
          className="inline-flex items-center justify-center gap-2.5 bg-fg text-card px-5 py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="font-mono text-xs">G</span>
          Google로 계속하기
        </button>
      </div>
    </div>
  );
}
