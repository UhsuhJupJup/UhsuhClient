import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  titleClassName = "",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  titleClassName?: string;
}) {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.22em] text-acorn">
            {eyebrow}
          </p>
          <h1
            className={`mt-2 mb-0 text-[36px] font-extrabold tracking-[-0.025em] text-fg ${titleClassName}`}
          >
            {title}
          </h1>
          {description && <p className="mt-2 mb-0 text-base text-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="mt-6 border-t border-border" />
    </header>
  );
}
