import Link from "next/link";

export function UnsubscribeResult({ status }: { status: "success" | "failed" }) {
  if (status === "failed") {
    return (
      <div className="flex flex-col items-center text-center py-24 px-4">
        <div className="text-5xl mb-5" aria-hidden>
          🐿️
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] m-0">
          해지 링크가 유효하지 않아요
        </h1>
        <p className="text-base text-muted mt-4 mb-9 max-w-[440px] leading-relaxed">
          이미 해지됐거나 링크가 만료됐을 수 있어요. 계속 메일이 온다면 가장 최근 메일의 해지 링크를 다시 눌러 주세요.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-fg px-7 py-4 rounded-xl font-extrabold text-base no-underline hover:opacity-90 transition-opacity"
        >
          홈으로 가기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center py-24 px-4">
      <div className="text-5xl mb-5" aria-hidden>
        👋
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] m-0">
        구독이 해지됐어요
      </h1>
      <p className="text-lg text-muted mt-4 mb-9 max-w-[440px] leading-relaxed">
        이제 아침 줍줍 메일을 보내지 않을게요. 언제든 다시 구독할 수 있어요 🐿️
      </p>
      <Link
        href="/subscribe/email"
        className="inline-flex items-center gap-2 bg-primary text-primary-fg px-7 py-4 rounded-xl font-extrabold text-base no-underline hover:opacity-90 transition-opacity"
      >
        다시 구독하기 →
      </Link>
    </div>
  );
}
