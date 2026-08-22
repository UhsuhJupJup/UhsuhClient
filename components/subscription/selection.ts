export function sameIds(selected: Map<number, string>, initial: Set<number>): boolean {
  if (selected.size !== initial.size) return false;
  for (const id of selected.keys()) {
    if (!initial.has(id)) return false;
  }
  return true;
}
