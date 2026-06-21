import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyChange, byPosition } from '../src/lib/reconcile';
import type { ChangeEvent, Item } from '../src/lib/types';

/**
 * Deterministic, offline proof of the real-time sync mechanism.
 *
 * We model exactly what Supabase Realtime does: the "server" holds the rows,
 * and every mutation emits a postgres_changes event to all subscribers. Each
 * client folds those events through the SAME `applyChange` reducer the app's
 * hooks use. So if two clients converge here, they converge in the app.
 */

const LIST = 'list-1';
const now = () => new Date().toISOString();

function makeItem(over: Partial<Item>): Item {
  return {
    id: over.id ?? 'i' + Math.random(),
    list_id: LIST,
    text: over.text ?? '',
    is_done: over.is_done ?? false,
    position: over.position ?? 0,
    created_at: over.created_at ?? now(),
    updated_at: over.updated_at ?? now(),
    ...over,
  };
}

/** A tiny stand-in for Supabase Realtime: a server table + subscribers. */
class FakeRealtime {
  private rows = new Map<string, Item>();
  private subs: ((e: ChangeEvent<Item>) => void)[] = [];

  subscribe(fn: (e: ChangeEvent<Item>) => void) {
    this.subs.push(fn);
  }
  private emit(e: ChangeEvent<Item>) {
    for (const fn of this.subs) fn(e);
  }

  insert(item: Item) {
    this.rows.set(item.id, item);
    this.emit({ eventType: 'INSERT', new: item, old: {} });
  }
  update(id: string, patch: Partial<Item>) {
    const next = { ...this.rows.get(id)!, ...patch, updated_at: now() };
    this.rows.set(id, next);
    this.emit({ eventType: 'UPDATE', new: next, old: {} });
  }
  remove(id: string) {
    this.rows.delete(id);
    this.emit({ eventType: 'DELETE', new: {}, old: { id } });
  }
  reset() {
    for (const [id, row] of this.rows) if (row.is_done) this.update(id, { is_done: false });
  }
}

/** A client whose local view is rebuilt purely from realtime events. */
class Client {
  items: Item[] = [];
  constructor(hub: FakeRealtime) {
    hub.subscribe((e) => {
      this.items = applyChange(this.items, e, byPosition);
    });
  }
  done(id: string) {
    return this.items.find((i) => i.id === id)?.is_done;
  }
}

test('an action on client A appears on client B (add, mark, unmark, delete, reset)', () => {
  const hub = new FakeRealtime();
  const a = new Client(hub);
  const b = new Client(hub);

  // A adds two items -> both clients see them.
  hub.insert(makeItem({ id: 'milk', text: 'חלב', position: 1 }));
  hub.insert(makeItem({ id: 'eggs', text: 'ביצים', position: 2 }));
  assert.equal(a.items.length, 2);
  assert.equal(b.items.length, 2, 'B received the inserts');
  assert.deepEqual(
    b.items.map((i) => i.text),
    ['חלב', 'ביצים'],
    'order preserved by position',
  );

  // A marks "milk" done (strikethrough) -> B sees the strikethrough.
  hub.update('milk', { is_done: true });
  assert.equal(b.done('milk'), true, 'B sees the mark');
  assert.equal(b.items.length, 2, 'mark does NOT delete the row');

  // A unmarks "milk" -> B sees it cleared.
  hub.update('milk', { is_done: false });
  assert.equal(b.done('milk'), false, 'B sees the unmark');

  // Mark both, then RESET -> all strikethroughs cleared, items intact.
  hub.update('milk', { is_done: true });
  hub.update('eggs', { is_done: true });
  assert.equal(b.done('milk'), true);
  hub.reset();
  assert.equal(b.done('milk'), false, 'reset cleared milk');
  assert.equal(b.done('eggs'), false, 'reset cleared eggs');
  assert.equal(b.items.length, 2, 'reset kept every item');

  // Permanent delete is separate from strikethrough.
  hub.remove('eggs');
  assert.equal(b.items.length, 1, 'B sees the permanent delete');
  assert.equal(
    b.items.find((i) => i.id === 'eggs'),
    undefined,
  );

  // Both clients are fully converged.
  assert.deepEqual(a.items, b.items, 'A and B converge to the same state');
});

test('last write wins: the latest update overwrites earlier ones', () => {
  const hub = new FakeRealtime();
  const a = new Client(hub);
  const b = new Client(hub);
  hub.insert(makeItem({ id: 'x', text: 'first', position: 1 }));

  // Two near-simultaneous edits; the last event the server emits wins.
  hub.update('x', { text: 'edit-from-A' });
  hub.update('x', { text: 'edit-from-B' });

  assert.equal(a.items[0].text, 'edit-from-B');
  assert.equal(b.items[0].text, 'edit-from-B');
});
