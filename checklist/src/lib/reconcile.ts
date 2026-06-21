import type { ChangeEvent } from './types';

/**
 * Applies a single realtime postgres_changes event to a local array of rows,
 * keyed by `id`. This is the heart of the real-time sync: every device runs
 * the same reducer over the same event stream, so all screens converge.
 *
 * - INSERT  -> add the row (or replace if we already have it, e.g. our own
 *              optimistic copy).
 * - UPDATE  -> replace the row. This is where "last write wins" lives: we
 *              simply overwrite with whatever the server last stored.
 * - DELETE  -> drop the row by id.
 *
 * Order is preserved by `sort`, so callers get a stable, sorted view.
 */
export function applyChange<T extends { id: string }>(
  rows: T[],
  event: ChangeEvent<T>,
  sort: (a: T, b: T) => number,
): T[] {
  switch (event.eventType) {
    case 'INSERT':
    case 'UPDATE': {
      const row = event.new as T;
      if (!row || !row.id) return rows;
      const without = rows.filter((r) => r.id !== row.id);
      return [...without, row].sort(sort);
    }
    case 'DELETE': {
      const id = (event.old as { id?: string })?.id;
      if (!id) return rows;
      return rows.filter((r) => r.id !== id);
    }
    default:
      return rows;
  }
}

export const byPosition = (a: { position: number }, b: { position: number }) =>
  a.position - b.position;

export const byCreatedAt = (a: { created_at: string }, b: { created_at: string }) =>
  a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
