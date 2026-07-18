import Link from "next/link";

const WINDOW = 5;

const base =
  "min-w-9 h-9 px-3 inline-flex items-center justify-center rounded-lg text-sm font-semibold no-underline border transition-colors";
const idle = "bg-card text-fg border-border hover:border-primary hover:text-primary";
const active = "bg-primary text-primary-fg border-primary";
const disabled = "bg-card text-muted border-border opacity-40 pointer-events-none";

export function Pagination({
  currentPage,
  totalPages,
  hrefForPage,
}: {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - WINDOW + 1));
  const end = Math.min(totalPages, start + WINDOW - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10" aria-label="페이지네이션">
      {currentPage > 1 ? (
        <Link href={hrefForPage(currentPage - 1)} className={`${base} ${idle}`}>
          이전
        </Link>
      ) : (
        <span className={`${base} ${disabled}`}>이전</span>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefForPage(p)}
          aria-current={p === currentPage ? "page" : undefined}
          className={`${base} ${p === currentPage ? active : idle}`}
        >
          {p}
        </Link>
      ))}

      {currentPage < totalPages ? (
        <Link href={hrefForPage(currentPage + 1)} className={`${base} ${idle}`}>
          다음
        </Link>
      ) : (
        <span className={`${base} ${disabled}`}>다음</span>
      )}
    </nav>
  );
}
