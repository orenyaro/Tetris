import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';

/**
 * LIVE real-time sync proof against a real Supabase project.
 *
 * Two independent clients connect to the SAME list. Client B subscribes; client
 * A performs each action; we assert B receives the matching realtime event.
 *
 * Requires env vars (skips cleanly without them):
 *   EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
 * Run:  npm run test:live   (after filling .env)
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const skip = !url || !key;

function waitFor<T>(predicate: () => T | undefined, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const v = predicate();
      if (v !== undefined && v !== false) return resolve(v as T);
      if (Date.now() - started > timeoutMs) return reject(new Error('timed out waiting for event'));
      setTimeout(tick, 50);
    };
    tick();
  });
}

test(
  'live: action on client A streams to client B',
  { skip: skip ? 'set EXPO_PUBLIC_SUPABASE_URL/ANON_KEY to run' : false },
  async (t) => {
    const A = createClient(url!, key!, { realtime: { params: { eventsPerSecond: 20 } } });
    const B = createClient(url!, key!, { realtime: { params: { eventsPerSecond: 20 } } });

    // Client A creates a fresh, isolated list.
    const code = 'T' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const { data: list, error: listErr } = await A.from('lists')
      .insert({ name: 'sync-test', share_code: code })
      .select()
      .single();
    assert.equal(listErr, null, listErr?.message);
    const listId = list!.id;

    t.after(async () => {
      await A.from('lists').delete().eq('id', listId);
      await A.removeAllChannels();
      await B.removeAllChannels();
    });

    // Client B subscribes to this list's items.
    const events: any[] = [];
    const ready = new Promise<void>((resolve) => {
      B.channel(`items-${listId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${listId}` },
          (payload) => events.push(payload),
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') resolve();
        });
    });
    await ready;

    // 1) ADD on A -> INSERT seen on B.
    const { data: item } = await A.from('items')
      .insert({ list_id: listId, text: 'חלב', position: 1 })
      .select()
      .single();
    const insert = await waitFor(() =>
      events.find((e) => e.eventType === 'INSERT' && e.new.id === item!.id),
    );
    assert.equal(insert.new.text, 'חלב');

    // 2) MARK on A -> UPDATE with is_done=true seen on B.
    await A.from('items').update({ is_done: true }).eq('id', item!.id);
    const marked = await waitFor(() =>
      events.find((e) => e.eventType === 'UPDATE' && e.new.id === item!.id && e.new.is_done === true),
    );
    assert.equal(marked.new.is_done, true);

    // 3) RESET on A -> UPDATE back to is_done=false seen on B.
    await A.from('items').update({ is_done: false }).eq('list_id', listId);
    await waitFor(() =>
      events.find((e) => e.eventType === 'UPDATE' && e.new.id === item!.id && e.new.is_done === false),
    );

    // 4) DELETE on A -> DELETE seen on B.
    await A.from('items').delete().eq('id', item!.id);
    await waitFor(() => events.find((e) => e.eventType === 'DELETE' && e.old.id === item!.id));

    assert.ok(events.length >= 4, 'B received the full action stream');
  },
);
