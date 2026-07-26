"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";

export function ArchiveNavLink({ className }: { className?: string }) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Link href="/archive" className={className}>
      보관함
    </Link>
  );
}
