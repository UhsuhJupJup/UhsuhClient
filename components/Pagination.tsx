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
  onNavigate,
}: {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  onNavigate?: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - WINDOW + 1));
  const end = Math.min(totalPages, start + WINDOW - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const cell = (page: number, label: React.ReactNode, isActive: boolean) =>
    onNavigate ? (
      <button
        key={label === page ? page : `nav-${label}`}
        type="button"
        onClick={() => onNavigate(page)}
        aria-current={isActive ? "page" : undefined}
        className={`${base} ${isActive ? active : idle}`}
      >
        {label}
      </button>
    ) : (
      <Link
        key={label === page ? page : `nav-${label}`}
        href={hrefForPage(page)}
        aria-current={isActive ? "page" : undefined}
        className={`${base} ${isActive ? active : idle}`}
      >
        {label}
      </Link>
    );

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10" aria-label="페이지네이션">
      {currentPage > 1 ? (
        cell(currentPage - 1, "이전", false)
      ) : (
        <span className={`${base} ${disabled}`}>이전</span>
      )}

      {pages.map((p) => cell(p, p, p === currentPage))}

      {currentPage < totalPages ? (
        cell(currentPage + 1, "다음", false)
      ) : (
        <span className={`${base} ${disabled}`}>다음</span>
      )}
    </nav>
  );
}
