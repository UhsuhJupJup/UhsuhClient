"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";

export function NotesNavLink({ className }: { className?: string }) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Link href="/notes" className={className}>
      노트
    </Link>
  );
}
