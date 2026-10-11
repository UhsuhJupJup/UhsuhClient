import Link from "next/link";
import type { RelatedKeyword } from "@/lib/types";
import { formatCount } from "@/lib/format";

const RELATED_KEYWORD_LIMIT = 8;

const MIN_BAR_PERCENT = 4;

export function RelatedKeywordList({
  keywords,
  onSelect,
  dense = false,
}: {
  keywords: RelatedKeyword[];
  onSelect?: (keyword: RelatedKeyword) => void;
  dense?: boolean;
}) {
  const visible = keywords.slice(0, RELATED_KEYWORD_LIMIT);
  const top = Math.max(1, ...visible.map((keyword) => keyword.sharedArticleCount));

  const rowClass = `group grid w-full items-center rounded-[10px] border-0 bg-transparent text-left text-fg no-underline cursor-pointer transition-colors hover:bg-surface ${
    dense
      ? "grid-cols-[minmax(72px,112px)_minmax(0,1fr)_auto] gap-2.5 px-1.5 py-1.5"
      : "grid-cols-[minmax(84px,112px)_minmax(0,1fr)_auto] gap-2.5 px-1 py-2 sm:grid-cols-[minmax(96px,168px)_minmax(0,1fr)_auto] sm:gap-3.5 sm:px-2.5"
  }`;

  return (
    <ul className="m-0 grid list-none gap-0.5 p-0">
      {visible.map((keyword) => {
        const percent = Math.max(
          MIN_BAR_PERCENT,
          Math.round((keyword.sharedArticleCount / top) * 100),
        );
        const row = (
          <>
            <span
              className={`min-w-0 font-mono font-semibold [overflow-wrap:anywhere] transition-colors group-hover:text-primary ${
                dense ? "text-[13px]" : "text-sm"
              }`}
            >
              {keyword.name}
            </span>
            <span
              aria-hidden
              className={`overflow-hidden rounded-full bg-chip-bg ${dense ? "h-2" : "h-2.5"}`}
            >
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${percent}%` }}
              />
            </span>
            <span
              className={`whitespace-nowrap text-right text-muted tabular-nums ${
                dense ? "text-[12.5px]" : "text-[13px]"
              }`}
            >
              글{" "}
              <b className={`font-mono font-semibold text-fg ${dense ? "text-[13px]" : "text-sm"}`}>
                {formatCount(keyword.sharedArticleCount)}
              </b>
              개
            </span>
          </>
        );
        return (
          <li key={keyword.id}>
            {onSelect ? (
              <button type="button" onClick={() => onSelect(keyword)} className={rowClass}>
                {row}
              </button>
            ) : (
              <Link href={`/keyword/${keyword.id}`} className={rowClass}>
                {row}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
