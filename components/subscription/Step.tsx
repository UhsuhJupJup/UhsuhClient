import type { ReactNode } from "react";

export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-primary text-primary-fg font-bold text-xs">
          {number}
        </span>
        <h2 className="text-lg font-bold m-0">{title}</h2>
      </div>
      {children}
    </div>
  );
}
