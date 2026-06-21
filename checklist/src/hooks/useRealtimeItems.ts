import { useCallback, useEffect, useState } from 'react';
import { fetchItems } from '../lib/db';
import { DEMO, demoItems } from '../lib/demo';
import { applyChange, byPosition } from '../lib/reconcile';
import { supabase } from '../lib/supabase';
import type { ChangeEvent, Item } from '../lib/types';

/**
 * Live view of one list's items. Subscribes to postgres_changes scoped to a
 * single list_id, so add / remove / mark / unmark / reset performed on any
 * device stream in for everyone with this list open.
 */
export function useRealtimeItems(listId: string | undefined) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!listId) return;
    try {
      setError(null);
      setItems(await fetchItems(listId));
    } catch (e: any) {
      setError(e?.message ?? 'Could not load items');
    } finally {
      setLoading(false);
    }
  }, [listId]);

  // Apply our own changes optimistically so the actor sees instant feedback.
  const applyLocal = useCallback((event: ChangeEvent<Item>) => {
    setItems((cur) => applyChange(cur, event, byPosition));
  }, []);

  useEffect(() => {
    if (!listId) return;
    if (DEMO) {
      setItems(demoItems);
      setLoading(false);
      return;
    }
    load();

    const channel = supabase
      .channel(`items-realtime-${listId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${listId}` },
        (payload) => {
          setItems((cur) => applyChange(cur, payload as ChangeEvent<Item>, byPosition));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, load]);

  return { items, loading, error, reload: load, applyLocal };
}
