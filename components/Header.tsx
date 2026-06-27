import Link from "next/link";
import { Logo } from "@/components/Logo";

const navItemClass =
  "px-3 py-2 rounded-lg no-underline text-muted font-semibold text-sm hover:bg-chip-bg hover:text-fg transition-colors";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-[13px] flex items-center gap-5">
        <Link
          href="/"
          className="flex items-center gap-[9px] no-underline text-fg font-extrabold text-lg tracking-[-0.02em] whitespace-nowrap"
        >
          <span className="inline-flex w-[34px] h-[34px] items-center justify-center bg-primary text-primary-fg rounded-[9px]">
            <Logo size={20} />
          </span>
          어서줍줍
        </Link>

        <nav className="flex gap-1 ml-1.5 whitespace-nowrap">
          <Link href="/explore" className={navItemClass}>
            탐색
          </Link>
          <Link href="/subscribe" className={navItemClass}>
            구독
          </Link>
        </nav>

        <div className="ml-auto">
          <Link
            href="/subscribe"
            className="inline-flex items-center bg-primary text-primary-fg px-4 py-2 rounded-[9px] font-bold text-sm no-underline hover:opacity-90 transition-opacity"
          >
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
}
