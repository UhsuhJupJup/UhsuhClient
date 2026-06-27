import Link from "next/link";

export function SubscribeCta({ label }: { label: string }) {
  return (
    <Link
      href="/subscribe"
      className="inline-flex items-center gap-1.5 bg-primary-soft text-primary border border-border px-4 py-2.5 rounded-[10px] font-bold text-sm no-underline hover:bg-primary hover:text-primary-fg hover:border-primary transition-colors whitespace-nowrap"
    >
      {label}
    </Link>
  );
}
