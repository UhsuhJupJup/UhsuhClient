import Link from "next/link";
import { Logo } from "@/components/Logo";
import { HeaderAuth } from "@/components/HeaderAuth";
import { SubscribeNavLink } from "@/components/SubscribeNavLink";
import { NotesNavLink } from "@/components/NotesNavLink";
import { ArchiveNavLink } from "@/components/ArchiveNavLink";
import { AdminNavLink } from "@/components/AdminNavLink";

const navItemClass =
  "px-3 py-2 rounded-lg no-underline text-muted font-semibold text-sm hover:bg-chip-bg hover:text-fg transition-colors";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-[13px] flex items-center gap-5">
        <Link
          href="/"
          className="flex items-center gap-2 no-underline text-fg font-extrabold text-lg tracking-[-0.02em] whitespace-nowrap"
        >
          <Logo size={32} />
          어서줍줍
        </Link>

        <nav className="flex gap-1 ml-1.5 whitespace-nowrap">
          <Link href="/explore" className={navItemClass}>
            줍줍한 글
          </Link>
          <SubscribeNavLink className={navItemClass} />
          <AdminNavLink className={navItemClass} />
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ArchiveNavLink className={navItemClass} />
          <NotesNavLink className={navItemClass} />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
