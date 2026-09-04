import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { swapPositions } from './order';
import type { PersonId } from './people';
import * as remote from './remote';
import { isConfigured } from './supabase';
import type { Item, List } from './types';

/**
 * Store with optional cloud sync.
 *
 * - Local-first: state lives on the device (AsyncStorage → localStorage on web),
 *   so every action is instant and works offline. Exposed via useSyncExternalStore.
 * - When Supabase keys are present (isConfigured), the store also mirrors every
 *   change to Supabase and refetches on realtime events, so the same lists appear
 *   on every phone (last-write-wins).
 *
 * Ordering: both lists and items carry a `position`; reorder helpers swap
 * positions with the neighbour, giving manual up/down control.
 */

const KEY = 'checklists_v3';

type State = { lists: List[]; items: Item[] };

let state: State = { lists: [], items: [] };
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}

function commit(next: State) {
  state = next;
  emit();
  persist();
}

function uid() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

const now = () => new Date().toISOString();

// Surfaced sync error (Supabase resolves failures as a { error } field rather
// than throwing, so we must inspect it — otherwise failed writes are silent).
let syncError: string | null = null;
const getSyncError = () => syncError;
function setSyncError(msg: string | null) {
  if (syncError === msg) return;
  syncError = msg;
  emit();
}
export function useSyncError(): string | null {
  return useSyncExternalStore(subscribe, getSyncError, getSyncError);
}

// Send a remote write when cloud sync is on; capture any error so it's visible.
function push(run: () => unknown) {
  if (!isConfigured) return;
  Promise.resolve(run())
    .then((res: any) => {
      if (res && res.error) setSyncError(res.error.message ?? String(res.error));
      else setSyncError(null);
    })
    .catch((e: any) => setSyncError(e?.message ?? 'sync failed'));
}

// ---- loading / subscription ----------------------------------------------

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

async function loadCache() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
  } catch {
    /* ignore */
  }
}

export async function loadStore() {
  if (isConfigured) {
    // Try the cloud, but never block the UI on it: if it's slow/unreachable we
    // show the cached copy and let the realtime subscription catch us up.
    try {
      state = await withTimeout(remote.fetchAll(), 6000);
      persist();
      setSyncError(null);
    } catch (e: any) {
      setSyncError('טעינה מהשרת נכשלה: ' + (e?.message ?? 'לא ידוע'));
      await loadCache();
    }
    try {
      remote.subscribe(async () => {
        try {
          state = await remote.fetchAll();
          persist();
          emit();
        } catch {
          /* keep showing the last good state */
        }
      });
    } catch {
      /* ignore */
    }
    loaded = true;
    emit();
    return;
  }

  // Local-only: load the cache, or seed a friendly starter list on first run.
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      state = JSON.parse(raw);
    } else {
      state = seed();
      persist();
    }
  } catch {
    state = { lists: [], items: [] };
  }
  loaded = true;
  emit();
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function isLoaded() {
  return loaded;
}

// Force a fresh pull from the cloud (used by the manual refresh button on native;
// on web the button reloads the page, which re-runs loadStore anyway).
export async function syncNow() {
  if (!isConfigured) return;
  try {
    state = await remote.fetchAll();
    persist();
    emit();
  } catch {
    /* keep showing the last good state */
  }
}

const getLists = () => state.lists;
const getItems = () => state.items;

export function useLists(): List[] {
  return useSyncExternalStore(subscribe, getLists, getLists);
}
export function useItems(): Item[] {
  return useSyncExternalStore(subscribe, getItems, getItems);
}

// ---- lists ----------------------------------------------------------------

export function createList(name: string): List {
  const maxPos = state.lists.reduce((m, l) => Math.max(m, l.position ?? 0), 0);
  const list: List = { id: uid(), name: name.trim(), position: maxPos + 1, created_at: now() };
  commit({ ...state, lists: [...state.lists, list] });
  push(() => remote.insertList(list));
  return list;
}

export function deleteList(id: string) {
  commit({
    lists: state.lists.filter((l) => l.id !== id),
    items: state.items.filter((i) => i.list_id !== id),
  });
  push(() => remote.deleteList(id));
}

export function renameList(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  commit({
    ...state,
    lists: state.lists.map((l) => (l.id === id ? { ...l, name: trimmed } : l)),
  });
  push(() => remote.updateList(id, { name: trimmed }));
}

export function getList(id: string): List | undefined {
  return state.lists.find((l) => l.id === id);
}

// ---- items ----------------------------------------------------------------

export function addItem(listId: string, text: string, assignee: PersonId | null = null): Item {
  // New items go to the TOP of the list (smallest position).
  const positions = state.items.filter((i) => i.list_id === listId).map((i) => i.position);
  const minPos = positions.length ? Math.min(...positions) : 1;
  const item: Item = {
    id: uid(),
    list_id: listId,
    text: text.trim(),
    is_done: false,
    position: minPos - 1,
    assignee,
    created_at: now(),
    updated_at: now(),
  };
  commit({ ...state, items: [...state.items, item] });
  push(() => remote.insertItem(item));
  return item;
}

export function deleteItem(id: string) {
  commit({ ...state, items: state.items.filter((i) => i.id !== id) });
  push(() => remote.deleteItem(id));
}

export function editItemText(id: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const at = now();
  commit({
    ...state,
    items: state.items.map((i) => (i.id === id ? { ...i, text: trimmed, updated_at: at } : i)),
  });
  push(() => remote.updateItem(id, { text: trimmed, updated_at: at }));
}

export function setAssignee(id: string, assignee: PersonId | null) {
  const at = now();
  commit({
    ...state,
    items: state.items.map((i) => (i.id === id ? { ...i, assignee, updated_at: at } : i)),
  });
  push(() => remote.updateItem(id, { assignee, updated_at: at }));
}

export function toggleItem(id: string) {
  const at = now();
  const target = state.items.find((i) => i.id === id);
  if (!target) return;
  const nextDone = !target.is_done;
  commit({
    ...state,
    items: state.items.map((i) => (i.id === id ? { ...i, is_done: nextDone, updated_at: at } : i)),
  });
  push(() => remote.updateItem(id, { is_done: nextDone, updated_at: at }));
}

// Reset: clear every strikethrough in a list, keep all items.
export function resetList(listId: string) {
  commit({
    ...state,
    items: state.items.map((i) =>
      i.list_id === listId && i.is_done ? { ...i, is_done: false, updated_at: now() } : i,
    ),
  });
  push(() => remote.resetListItems(listId));
}

// ---- manual reordering (swap positions with the neighbour) ----------------

export function moveList(id: string, dir: -1 | 1) {
  commit({ ...state, lists: swapPositions(state.lists, id, dir) });
  push(() => remote.upsertLists(state.lists));
}

// Apply a full new order for one list's items (used by drag-and-drop).
export function reorderItems(listId: string, orderedIds: string[]) {
  const at = now();
  const posById = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
  const updated = state.items.map((i) =>
    i.list_id === listId && posById.has(i.id)
      ? { ...i, position: posById.get(i.id) as number, updated_at: at }
      : i,
  );
  commit({ ...state, items: updated });
  push(() => remote.upsertItems(updated.filter((i) => i.list_id === listId)));
}

export function moveItem(id: string, dir: -1 | 1) {
  // Reorder only within the same list, so scope the swap to that list's items.
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  const inList = state.items.filter((i) => i.list_id === item.list_id);
  const others = state.items.filter((i) => i.list_id !== item.list_id);
  commit({ ...state, items: [...others, ...swapPositions(inList, id, dir)] });
  push(() => remote.upsertItems(state.items.filter((i) => i.list_id === item.list_id)));
}

// ---- first-run seed -------------------------------------------------------

function seed(): State {
  const listId = uid();
  const list: List = { id: listId, name: 'קניות לשבת', position: 1, created_at: now() };
  const rows: { text: string; assignee: PersonId | null }[] = [
    { text: 'חלה', assignee: 'ima' },
    { text: 'יין לקידוש', assignee: 'abba' },
    { text: 'ירקות לסלט', assignee: 'adam' },
    { text: 'עוף', assignee: 'naor' },
  ];
  const items: Item[] = rows.map((r, idx) => ({
    id: uid(),
    list_id: listId,
    text: r.text,
    is_done: idx === 1, // one item starts marked, to show the strikethrough
    position: idx + 1,
    assignee: r.assignee,
    created_at: now(),
    updated_at: now(),
  }));
  return { lists: [list], items };
}
