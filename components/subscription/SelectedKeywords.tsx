export function SelectedKeywords({
  selected,
  onRemove,
}: {
  selected: Map<number, string>;
  onRemove: (id: number, name: string) => void;
}) {
  if (selected.size === 0) {
    return <p className="text-sm text-muted m-0">토픽을 누르거나 검색해서 담아주세요.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2 max-h-[320px] overflow-y-auto">
      {[...selected].map(([id, name]) => (
        <span
          key={`k-${id}`}
          className="inline-flex items-center gap-1.5 bg-primary-soft text-primary font-mono text-sm px-3 py-1.5 rounded-lg"
        >
          {name}
          <button onClick={() => onRemove(id, name)} aria-label="제거" className="hover:text-danger">
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
