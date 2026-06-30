"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getMember } from "@/lib/api/members";

export function AdminNavLink({ className }: { className?: string }) {
  const { user, getIdToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        if (active) setIsAdmin(false);
        return;
      }
      try {
        const token = await getIdToken();
        if (!token) return;
        const member = await getMember(token);
        if (active) setIsAdmin(member.role === "ADMIN");
      } catch {
        if (active) setIsAdmin(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, getIdToken]);

  if (!isAdmin) return null;

  return (
    <Link href="/admin" className={className}>
      관리자
    </Link>
  );
}
