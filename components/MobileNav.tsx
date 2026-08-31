"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { HeaderAuth } from "@/components/HeaderAuth";
import { SubscribeNavLink } from "@/components/SubscribeNavLink";
import { NotesNavLink } from "@/components/NotesNavLink";
import { ArchiveNavLink } from "@/components/ArchiveNavLink";
import { AdminNavLink } from "@/components/AdminNavLink";

const mobileItemClass =
  "block px-3 py-2.5 rounded-lg no-underline text-fg font-semibold text-base hover:bg-chip-bg hover:text-primary transition-colors";

export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-fg hover:bg-chip-bg transition-colors"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute left-0 right-0 top-full z-50 flex flex-col gap-0.5 bg-white border-b border-border px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
            <Link href="/explore" className={mobileItemClass}>
              줍줍한 글
            </Link>
            <SubscribeNavLink className={mobileItemClass} />
            <ArchiveNavLink className={mobileItemClass} />
            <NotesNavLink className={mobileItemClass} />
            <AdminNavLink className={mobileItemClass} />
            <div className="mt-1 pt-2 border-t border-border">
              <HeaderAuth />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
