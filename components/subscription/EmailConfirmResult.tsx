import Link from "next/link";

export function EmailConfirmResult({ status }: { status: "success" | "failed" }) {
  if (status === "failed") {
    return (
      <div className="flex flex-col items-center text-center py-24 px-4">
        <div className="text-5xl mb-5" aria-hidden>
          🐿️
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] m-0">
          확인 링크가 만료됐거나 유효하지 않아요
        </h1>
        <p className="text-base text-muted mt-4 mb-9 max-w-[440px] leading-relaxed">
          링크는 24시간 뒤 만료돼요. 번거롭지만 다시 구독해 주세요.
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

  return (
    <div className="flex flex-col items-center text-center py-24 px-4">
      <div className="text-5xl mb-5" aria-hidden>
        🎉
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] m-0">
        구독이 완료됐습니다
      </h1>
      <p className="text-lg text-muted mt-4 mb-9 max-w-[440px] leading-relaxed">
        매일 아침 8시에 줍줍해서 보내드려요 🐿️
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-primary text-primary-fg px-7 py-4 rounded-xl font-extrabold text-base no-underline hover:opacity-90 transition-opacity"
      >
        줍줍하기 →
      </Link>
    </div>
  );
}
