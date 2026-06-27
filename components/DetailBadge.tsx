export function DetailBadge({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs font-bold text-primary bg-primary-soft px-2.5 py-1 rounded-full mb-2">
      {label}
    </span>
  );
}
