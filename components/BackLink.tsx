import Link from "next/link";

export function BackLink({
  href = "/explore",
  label = "← 탐색으로",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-block text-sm font-semibold text-muted no-underline hover:text-primary mb-6 transition-colors"
    >
      {label}
    </Link>
  );
}
