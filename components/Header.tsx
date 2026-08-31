import Link from "next/link";
import { Logo } from "@/components/Logo";
import { HeaderAuth } from "@/components/HeaderAuth";
import { SubscribeNavLink } from "@/components/SubscribeNavLink";
import { NotesNavLink } from "@/components/NotesNavLink";
import { ArchiveNavLink } from "@/components/ArchiveNavLink";
import { AdminNavLink } from "@/components/AdminNavLink";
import { MobileNav } from "@/components/MobileNav";

const navItemClass =
  "px-3 py-2 rounded-lg no-underline text-fg font-semibold text-[16px] hover:bg-chip-bg hover:text-primary transition-colors";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 py-3.5 sm:py-5 flex items-center gap-3 sm:gap-5">
        <Link
          href="/"
          className="flex items-center gap-2 no-underline text-fg font-extrabold text-lg tracking-[-0.02em] whitespace-nowrap"
        >
          <Logo size={40} />
          어서줍줍
        </Link>

        <nav className="hidden md:flex gap-1 ml-1.5 whitespace-nowrap">
          <Link href="/explore" className={navItemClass}>
            줍줍한 글
          </Link>
          <SubscribeNavLink className={navItemClass} />
          <AdminNavLink className={navItemClass} />
        </nav>

        <div className="hidden md:flex ml-auto items-center gap-1">
          <ArchiveNavLink className={navItemClass} />
          <NotesNavLink className={navItemClass} />
          <HeaderAuth />
        </div>

        <MobileNav className="md:hidden ml-auto" />
      </div>
    </header>
  );
}
