import Link from "next/link";
import { Logo } from "@/components/Logo";
import { HeaderAuth } from "@/components/HeaderAuth";
import { SubscribeNavLink } from "@/components/SubscribeNavLink";
import { NotesNavLink } from "@/components/NotesNavLink";
import { ArchiveNavLink } from "@/components/ArchiveNavLink";
import { AdminNavLink } from "@/components/AdminNavLink";

const navItemClass =
  "px-3 py-2 rounded-lg no-underline text-fg font-semibold text-[16px] hover:bg-chip-bg hover:text-primary transition-colors";

const navItemLargeClass =
  "px-3 py-2 rounded-lg no-underline text-fg font-semibold text-[16px] hover:bg-chip-bg hover:text-primary transition-colors";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center gap-5">
        <Link
          href="/"
          className="flex items-center gap-2 no-underline text-fg font-extrabold text-lg tracking-[-0.02em] whitespace-nowrap"
        >
          <Logo size={40} />
          어서줍줍
        </Link>

        <nav className="flex gap-1 ml-1.5 whitespace-nowrap">
          <Link href="/explore" className={navItemLargeClass}>
            줍줍한 글
          </Link>
          <SubscribeNavLink className={navItemLargeClass} />
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
