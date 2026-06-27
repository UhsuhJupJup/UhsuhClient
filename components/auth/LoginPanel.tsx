"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Logo } from "@/components/Logo";

export function LoginPanel({ onDone }: { onDone?: () => void }) {
  const { loginWithGithub, loginWithGoogle, configured } = useAuth();
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
      <h1 className="text-2xl font-extrabold m-0">먼저 로그인하고 시작하세요</h1>
      <p className="text-base text-muted mt-3 mb-7 max-w-[360px] mx-auto leading-relaxed">
        로그인하면 구독한 토픽, 키워드가 기기 간에 동기화돼요. 소셜 계정으로 10초면 시작할 수 있어요.
      </p>

      {!configured && (
        <p className="text-sm text-danger mb-4">
          Firebase 설정이 필요해요 (.env.local의 NEXT_PUBLIC_FIREBASE_* 값).
        </p>
      )}
      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <div className="flex flex-col gap-3">
        <button
          onClick={() => run(loginWithGithub)}
          disabled={!configured}
          className="inline-flex items-center justify-center gap-2.5 bg-fg text-card px-5 py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="font-mono text-xs">GH</span>
          GitHub로 계속하기
        </button>
        <button
          onClick={() => run(loginWithGoogle)}
          disabled={!configured}
          className="inline-flex items-center justify-center gap-2.5 bg-card text-fg border border-border px-5 py-3.5 rounded-xl font-bold text-base hover:bg-chip-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="font-mono text-xs">G</span>
          Google로 계속하기
        </button>
      </div>
    </div>
  );
}
