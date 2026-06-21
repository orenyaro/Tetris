import type { Item, List } from './types';

// Preview/demo mode: set EXPO_PUBLIC_DEMO=1 to explore the UI with sample data
// and NO Supabase connection. Purely a local design preview — it does not sync
// and is never used when the app is configured for real use.
export const DEMO = process.env.EXPO_PUBLIC_DEMO === '1';

const t = (s: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, s)).toISOString();

export const demoLists: List[] = [
  { id: 'd1', name: 'קניות לשבת', share_code: 'SHBT24', created_at: t(1) },
  { id: 'd2', name: 'מטלות הבית', share_code: 'BAYIT7', created_at: t(2) },
  { id: 'd3', name: 'ציוד לטיול', share_code: 'TIYUL9', created_at: t(3) },
];

export const demoItems: Item[] = [
  { id: 'a', list_id: 'd1', text: 'חלה', is_done: false, position: 1, created_at: t(1), updated_at: t(1) },
  { id: 'b', list_id: 'd1', text: 'יין לקידוש', is_done: true, position: 2, created_at: t(2), updated_at: t(2) },
  { id: 'c', list_id: 'd1', text: 'ירקות לסלט', is_done: false, position: 3, created_at: t(3), updated_at: t(3) },
  { id: 'd', list_id: 'd1', text: 'עוף', is_done: true, position: 4, created_at: t(4), updated_at: t(4) },
  { id: 'e', list_id: 'd1', text: 'נרות שבת', is_done: false, position: 5, created_at: t(5), updated_at: t(5) },
];

export const demoListById: Record<string, List> = Object.fromEntries(
  demoLists.map((l) => [l.id, l]),
);
