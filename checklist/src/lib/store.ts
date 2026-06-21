import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { swapPositions } from './order';
import type { PersonId } from './people';
import type { Item, List } from './types';

/**
 * Local-first store. All data lives on the device (AsyncStorage → localStorage
 * on web), so every action works instantly with no backend or login. State is
 * exposed through useSyncExternalStore so screens re-render on any change.
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

// ---- loading / subscription ----------------------------------------------

export async function loadStore() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      state = JSON.parse(raw);
    } else {
      state = seed(); // first run: a friendly starter list
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
  return list;
}

export function deleteList(id: string) {
  commit({
    lists: state.lists.filter((l) => l.id !== id),
    items: state.items.filter((i) => i.list_id !== id),
  });
}

export function renameList(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  commit({
    ...state,
    lists: state.lists.map((l) => (l.id === id ? { ...l, name: trimmed } : l)),
  });
}

export function getList(id: string): List | undefined {
  return state.lists.find((l) => l.id === id);
}

// ---- items ----------------------------------------------------------------

export function addItem(listId: string, text: string, assignee: PersonId | null = null): Item {
  const maxPos = state.items
    .filter((i) => i.list_id === listId)
    .reduce((m, i) => Math.max(m, i.position), 0);
  const item: Item = {
    id: uid(),
    list_id: listId,
    text: text.trim(),
    is_done: false,
    position: maxPos + 1,
    assignee,
    created_at: now(),
    updated_at: now(),
  };
  commit({ ...state, items: [...state.items, item] });
  return item;
}

export function deleteItem(id: string) {
  commit({ ...state, items: state.items.filter((i) => i.id !== id) });
}

export function setAssignee(id: string, assignee: PersonId | null) {
  commit({
    ...state,
    items: state.items.map((i) =>
      i.id === id ? { ...i, assignee, updated_at: now() } : i,
    ),
  });
}

export function toggleItem(id: string) {
  commit({
    ...state,
    items: state.items.map((i) =>
      i.id === id ? { ...i, is_done: !i.is_done, updated_at: now() } : i,
    ),
  });
}

// Reset: clear every strikethrough in a list, keep all items.
export function resetList(listId: string) {
  commit({
    ...state,
    items: state.items.map((i) =>
      i.list_id === listId && i.is_done ? { ...i, is_done: false, updated_at: now() } : i,
    ),
  });
}

// ---- manual reordering (swap positions with the neighbour) ----------------

export function moveList(id: string, dir: -1 | 1) {
  commit({ ...state, lists: swapPositions(state.lists, id, dir) });
}

export function moveItem(id: string, dir: -1 | 1) {
  // Reorder only within the same list, so scope the swap to that list's items.
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  const inList = state.items.filter((i) => i.list_id === item.list_id);
  const others = state.items.filter((i) => i.list_id !== item.list_id);
  commit({ ...state, items: [...others, ...swapPositions(inList, id, dir)] });
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
