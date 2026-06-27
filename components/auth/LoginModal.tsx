"use client";

import { LoginPanel } from "@/components/auth/LoginPanel";

export function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-6"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-border rounded-[22px] p-9 w-full max-w-[420px] shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-4 right-4 text-muted hover:text-fg text-lg leading-none"
        >
          ✕
        </button>
        <LoginPanel onDone={onClose} />
      </div>
    </div>
  );
}
