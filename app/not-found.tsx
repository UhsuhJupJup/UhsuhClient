import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-[760px] mx-auto px-6 py-32 flex flex-col items-center text-center gap-3">
      <h1 className="text-2xl font-extrabold m-0">찾을 수 없어요</h1>
      <p className="text-base text-muted m-0">요청한 페이지나 항목이 없어요.</p>
      <Link
        href="/explore"
        className="mt-2 inline-flex items-center bg-primary text-primary-fg px-5 py-3 rounded-[11px] font-bold text-sm no-underline hover:opacity-90 transition-opacity"
      >
        탐색으로 가기
      </Link>
    </main>
  );
}
