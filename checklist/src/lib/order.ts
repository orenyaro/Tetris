/**
 * Pure reordering helper: swap a row's `position` with its neighbour in the
 * given direction (-1 = up/earlier, +1 = down/later). Returns a new array;
 * returns the input unchanged when the move would fall off either end.
 */
export function swapPositions<T extends { id: string; position: number }>(
  rows: T[],
  id: string,
  dir: -1 | 1,
): T[] {
  const sorted = [...rows].sort((a, b) => a.position - b.position);
  const idx = sorted.findIndex((r) => r.id === id);
  const target = idx + dir;
  if (idx < 0 || target < 0 || target >= sorted.length) return rows;
  const a = sorted[idx];
  const b = sorted[target];
  const ap = a.position;
  return rows.map((r) =>
    r.id === a.id ? { ...r, position: b.position } : r.id === b.id ? { ...r, position: ap } : r,
  );
}

export const byPosition = (a: { position: number }, b: { position: number }) =>
  a.position - b.position;
