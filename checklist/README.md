# הרשימות שלנו — Shared Family Checklists

A mobile app (iOS + Android) for creating and managing **shared checklists** with
**real-time sync**: several people open the same list and every change — add,
remove, mark, unmark, reset, create list, delete list — appears on everyone's
device instantly. No accounts; access a list from the shared home or via a
6-character share code.

- **Stack:** React Native + Expo (SDK 56, expo-router), Supabase (Postgres +
  Realtime), Reanimated animations.
- **Design:** *Coastal Calm* — sea-glass `#EFF3F2` background, deep-teal `#2A7F7E`
  accent, Frank Ruhl Libre + Newsreader. Full **RTL / Hebrew** layout.
- **Conflicts:** simple **last-write-wins**.

| Home | List |
|---|---|
| ![Home](screenshots/home.png) | ![List](screenshots/list.png) |

---

## 1. Configure Supabase (one-time, ~3 minutes)

1. Create a free project at <https://supabase.com> → **New project**.
2. Open **SQL Editor ▸ New query**, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This creates
   the `lists` and `items` tables, the `updated_at` trigger, enables **Realtime**
   on both tables, and adds anon-access RLS policies.
3. Open **Project Settings ▸ API** and copy:
   - **Project URL**
   - **anon public** key (the public client key — *not* `service_role`).
4. In this folder, copy the env template and paste your values:
   ```bash
   cp .env.example .env
   ```
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```
   `.env` is git-ignored. The `EXPO_PUBLIC_` prefix is what makes Expo expose the
   values to the app at build time.

> **Privacy note (by design):** with no logins, anyone holding the anon key
> reaches the same shared family space. That is the intended model for personal
> family use and is required for live create/delete sync without accounts.

## 2. Install & run on your phone

```bash
npm install
npx expo start
```

- Install **Expo Go** on your phone (App Store / Play Store).
- Scan the QR code from the terminal. The app opens on your device.
- If your phone and computer aren't on the same network: `npx expo start --tunnel`.

> **RTL note:** the app forces right-to-left layout. On a physical device the
> very first launch may need one reload (shake ▸ *Reload*, or press `r` in the
> terminal) for RTL to fully apply — standard React Native behavior.

## 3. Preview the design without Supabase (optional)

To explore the UI with sample data and **no backend**:
```bash
EXPO_PUBLIC_DEMO=1 npx expo start
```
Demo mode is read-only sample data; it never connects or syncs.

---

## Verifying real-time sync

### Manually, with two devices/emulators
1. Open the app on **two** phones (or one phone + a web tab via `npx expo start
   --web`).
2. On device A, create a list (or open one). On device B, open the **same** list
   (tap it on the home screen, or use **"פתיחה לפי קוד שיתוף"** with the
   6-char code shown on the list).
3. On A: add an item → it appears on B. Tap an item → it gets a strikethrough on
   B. Tap **איפוס סימונים** (Reset) → all strikethroughs clear on B, items stay.
   Delete an item → it disappears on B. Everything streams both ways.

### Automated tests
```bash
# Deterministic proof of the sync reducer — runs anywhere, no backend:
npm test

# Live proof against your real Supabase project (uses .env):
npm run test:live
```
- `npm test` drives the exact `applyChange` reducer the app's realtime hooks use,
  simulating two clients and asserting an action on A reaches B (add / mark /
  unmark / reset / delete + last-write-wins).
- `npm run test:live` connects **two real Supabase clients** to one list,
  subscribes one, performs each action on the other, and asserts the realtime
  events arrive. It skips automatically if `.env` is not set.

---

## How it works

- **Data model** (`supabase/schema.sql`): `lists(id, name, share_code,
  created_at)` and `items(id, list_id, text, is_done, position, created_at,
  updated_at)`. `is_done` is the **temporary strikethrough**; deleting a row is
  the **permanent** removal — two distinct actions. **Reset** sets `is_done=false`
  for a whole list and never touches the rows.
- **Sync** (`src/hooks/useRealtime*.ts` + `src/lib/reconcile.ts`): each screen
  seeds from a fetch, then subscribes to Supabase `postgres_changes`
  (items scoped by `list_id`). Every device folds the same event stream through
  one `applyChange` reducer, so all views converge. Updates simply overwrite —
  that is the last-write-wins behavior.
- **Screens** (`src/app/`): `index.tsx` (home — all lists, create, delete, join
  by code) and `list/[id].tsx` (items, add, delete, mark/unmark, reset, share).

## Project layout
```
checklist/
├─ src/
│  ├─ app/                 # expo-router screens
│  │  ├─ _layout.tsx       # fonts, forced RTL, theme
│  │  ├─ index.tsx         # Home
│  │  └─ list/[id].tsx     # List detail
│  ├─ components/          # Checkbox, ChecklistItem, ListCard
│  ├─ hooks/               # useRealtimeLists, useRealtimeItems
│  ├─ lib/                 # supabase client, db CRUD, reconcile, types, demo
│  └─ theme/               # colors, typography
├─ supabase/schema.sql     # run this in Supabase
├─ tests/                  # reconcile.test.ts (offline), sync.test.ts (live)
└─ .env.example
```
