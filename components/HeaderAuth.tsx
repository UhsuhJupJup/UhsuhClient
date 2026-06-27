"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LoginModal } from "@/components/auth/LoginModal";

export function HeaderAuth() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return <div className="w-20 h-9 bg-skeleton rounded-[9px]" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2.5 bg-card border border-border rounded-full pl-2 pr-3 py-1">
        <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-primary-soft text-primary font-extrabold text-xs">
          {(user.email ?? "?").charAt(0).toUpperCase()}
        </span>
        <span className="font-mono text-xs text-muted max-w-[160px] truncate">
          {user.email}
        </span>
        <button
          onClick={() => logout()}
          className="text-xs font-semibold text-muted hover:text-danger transition-colors"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center bg-primary text-primary-fg px-4 py-2 rounded-[9px] font-bold text-sm hover:opacity-90 transition-opacity"
      >
        로그인
      </button>
      {open && <LoginModal onClose={() => setOpen(false)} />}
    </>
  );
}
