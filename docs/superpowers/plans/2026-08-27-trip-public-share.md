# Trip Public Share Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every trip a public, read-only, unauthenticated page at `/t/<shareToken>/{itinerario,mapa,calendario}` that can be shared without exposing edit/delete controls or letting an anonymous visitor mutate data.

**Architecture:** Add a unique `shareToken` to the `trips` table (SQLite-generated random default, no backfill script needed). Add a new `(public)` route group outside the session-gated app shell, excluded from `proxy.ts`'s auth matcher. Reuse the existing itinerary/calendar presentation components by threading an explicit `readOnly` prop through them (they already gate their edit UI on a global `isReadOnly` flag — the prop just lets a single request force that behavior on regardless of the global flag). Close the resulting gap where a Server Action could still be invoked directly against the new public route by making every mutating action also require a real better-auth session, not just the deploy-wide `isReadOnly` check.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM (better-sqlite3 / libSQL), better-auth, Tailwind v4. No test framework is configured in this repo (no jest/vitest/playwright test suite wired up) — verification in this plan is `tsc`/`lint` plus manual/browser checks, matching how the rest of the app is verified.

**Spec:** `docs/superpowers/specs/2026-08-27-trip-public-share-design.md`

## Global Constraints

- Public page shows only itinerario, mapa, calendario (per spec's "fuera de alcance": no presupuesto, notas, utilidades, maletas).
- No new runtime dependencies — use Node's built-in `crypto` for token regeneration, not a new package.
- Every mutating Server Action must require both `!isReadOnly` (deploy safety) and a valid better-auth session (auth safety) — this is a project-wide invariant from here on, not just for the new code.
- `lib/env.ts` is imported by many `"use client"` components for the `isReadOnly` constant — it must stay import-safe for the client bundle, so the new session check cannot live there (see Task 2).

---

### Task 1: `shareToken` column and lookup query

**Files:**
- Modify: `db/schema.ts:5-17` (trips table)
- Modify: `lib/queries/trips.ts`

**Interfaces:**
- Produces: `getTripByShareToken(token: string): Promise<Trip | undefined>` — used by Task 6's public routes.
- Produces: `trips.shareToken` column, `text`, unique, not null, auto-populated on every insert (existing rows get it too, via `ALTER TABLE ... DEFAULT`, no manual backfill).

- [ ] **Step 1: Add the column to the schema**

In `db/schema.ts`, inside the `trips` table definition, add a `shareToken` field. It reuses the same `sql` default pattern already used for `createdAt` in the same table — SQLite evaluates `randomblob`/`hex` per row, so this also backfills existing rows automatically when the column is added:

```ts
export const trips = sqliteTable("trips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  emoji: text("emoji"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  travelers: integer("travelers"),
  displayCurrency: text("display_currency", { enum: ["EUR", "JPY"] }),
  eurToJpyRate: real("eur_to_jpy_rate"),
  shareToken: text("share_token")
    .notNull()
    .unique()
    .default(sql`(lower(hex(randomblob(16))))`),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});
```

- [ ] **Step 2: Push the schema change to the local database**

Run: `npm run db:push`

This alters the local `sqlite.db` (or the configured Turso DB) in place — expected, since this project pushes schema changes directly rather than tracking migration files (there is no `drizzle/` output directory in this repo). Confirm the prompt (if any) accepts adding the new column with its default expression, not a data-loss warning. If drizzle-kit reports it would drop/recreate a table, stop and investigate before continuing — that would indicate the default expression wasn't recognized as SQLite-native and needs adjusting, not force-accepting.

- [ ] **Step 3: Add the lookup query**

In `lib/queries/trips.ts`, add alongside `getTripById`:

```ts
export async function getTripByShareToken(token: string): Promise<Trip | undefined> {
  const [trip] = await db.select().from(trips).where(eq(trips.shareToken, token));
  return trip;
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

Manual check: open `sqlite.db` (e.g. `sqlite3 sqlite.db "select id, name, share_token from trips;"` or via a DB viewer) and confirm every existing trip row now has a 32-character hex `share_token`.

- [ ] **Step 5: Commit**

```bash
git add db/schema.ts lib/queries/trips.ts
git commit -m "feat(trips): add shareToken column and lookup query

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Require a real session for every mutation, not just `!isReadOnly`

**Files:**
- Create: `lib/mutation-guard.ts`
- Modify: `lib/env.ts` (remove `assertMutable`, keep `isReadOnly`)
- Modify: `lib/actions/activities.ts:7,41,48,55`
- Modify: `lib/actions/bags.ts:7,14,21,27,33,39,45`
- Modify: `lib/actions/checklist.ts:7,10,16`
- Modify: `lib/actions/days.ts:7,17`
- Modify: `lib/actions/notes.ts:7,15,26,36`
- Modify: `lib/actions/trips.ts:9,48,75,96`
- Modify: `lib/actions/utilities.ts:7,22,40`

**Interfaces:**
- Produces: `assertMutable(): Promise<void>` from `@/lib/mutation-guard` (was sync, from `@/lib/env`) — throws if the deploy is read-only OR if there is no better-auth session.
- Consumes: `isReadOnly` from `@/lib/env` (unchanged), `auth` from `@/lib/auth` (existing `betterAuth(...)` instance).

Why a new file instead of editing `assertMutable` in place inside `lib/env.ts`: `lib/env.ts` is imported by ~15 `"use client"` components purely for the `isReadOnly` boolean (e.g. `components/itinerario/activity-card.tsx`). `next/headers` and `@/lib/auth` (which pulls in the DB driver) are server-only — importing them at the top of `lib/env.ts` would break every client component that imports `isReadOnly`, since it's the same module graph. Keeping `isReadOnly` in `lib/env.ts` untouched and moving the now-async `assertMutable` into a new server-only module avoids that.

- [ ] **Step 1: Create the guard**

Create `lib/mutation-guard.ts`:

```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isReadOnly } from "@/lib/env";

export async function assertMutable() {
  if (isReadOnly) {
    throw new Error(
      "Esta acción no está disponible en la versión desplegada. Edita los datos en local y vuelve a importar la copia de seguridad."
    );
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("No autenticado.");
  }
}
```

- [ ] **Step 2: Remove the old export from `lib/env.ts`**

In `lib/env.ts`, delete the `assertMutable` function entirely, leaving only the `isReadOnly` export and its comment. The file should end with just:

```ts
export const isReadOnly =
  typeof window === "undefined"
    ? process.env.VERCEL === "1" && !process.env.TURSO_DATABASE_URL
    : process.env.NEXT_PUBLIC_READ_ONLY === "1";
```

- [ ] **Step 3: Repoint every action file's import and await every call site**

In each of the 7 files below, change the import line from:

```ts
import { assertMutable } from "@/lib/env";
```

to:

```ts
import { assertMutable } from "@/lib/mutation-guard";
```

and change every bare `assertMutable();` call to `await assertMutable();`. The exact call sites (verified by grep before writing this plan):

- `lib/actions/activities.ts` — lines 41, 48, 55 (`createActivity`, `updateActivity`, `deleteActivity`)
- `lib/actions/bags.ts` — lines 14, 21, 27, 33, 39, 45 (`createBag`, `updateBagName`, `deleteBag`, `createBagItem`, `toggleBagItem`, `deleteBagItem`)
- `lib/actions/checklist.ts` — lines 10, 16 (`toggleChecklistItem`, `createChecklistItem`)
- `lib/actions/days.ts` — line 17 (`updateDay`)
- `lib/actions/notes.ts` — lines 15, 26, 36 (`createNote`, `updateNote`, `deleteNote`)
- `lib/actions/trips.ts` — lines 48, 75, 96 (`createTrip`, `updateTrip`, `deleteTrip`; **not** `setActiveTrip`, which never called `assertMutable` — leave it as-is)
- `lib/actions/utilities.ts` — lines 22, 40 (with one more further down — grep for `assertMutable()` in this file to catch `deleteUtility` too)

Every one of these functions is already `async function`, so adding `await` in front of the call is the only change needed at each site — no signature changes.

- [ ] **Step 4: Verify no stray non-awaited call sites remain**

Run (Bash tool, POSIX):
```bash
grep -rn "assertMutable()" lib/actions/ | grep -v "await assertMutable"
```
Expected: no output. Any line here is a bug — calling an async function without `await` means the thrown rejection wouldn't block the mutation.

- [ ] **Step 5: Verify types and lint**

Run: `npx tsc --noEmit`
Run: `npm run lint`
Expected: both clean.

- [ ] **Step 6: Manual check — mutation without a session is rejected**

Start the dev server (`npm run dev`), open the app logged out (clear cookies or use an incognito window) — the `proxy.ts` guard should already redirect page loads to `/login`. This step specifically confirms the *action* itself now also rejects: log in normally, open devtools Network tab, edit any activity to capture the Server Action's POST request, then replay that exact request without the session cookie (e.g. via `curl` copying headers except `Cookie`, or an incognito tab hitting the same URL with the dev tools "Copy as fetch" minus cookies). Expected: the response reflects the thrown `"No autenticado."` error, and the row is unchanged in the DB.

- [ ] **Step 7: Commit**

```bash
git add lib/mutation-guard.ts lib/env.ts lib/actions/
git commit -m "fix(actions): require an authenticated session for mutations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Exclude the public share route from the session guard

**Files:**
- Modify: `proxy.ts:17`

**Interfaces:**
- Consumes: nothing new.
- Produces: `/t/*` reachable without a session cookie; every other path's behavior is unchanged.

- [ ] **Step 1: Update the matcher**

In `proxy.ts`, change:

```ts
export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

to:

```ts
export const config = {
  matcher: ["/((?!login|api/auth|t/|_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors (this is a plain config change, but confirms nothing else broke).

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat(auth): exclude public trip share routes from session guard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(This task ships a route prefix with nothing behind it yet — harmless on its own, and lets Task 6 be tested end-to-end without also having to touch `proxy.ts`.)

---

### Task 4: Make `MonthGrid` and `DaySheet` link to a configurable base path

**Files:**
- Modify: `components/calendar/month-grid.tsx:25,103-109`
- Modify: `components/calendar/day-sheet.tsx:19-32`

**Interfaces:**
- Produces: `MonthGrid({ days, basePath = "/calendario" })` — `basePath` prefixes the per-day link.
- Produces: `DaySheet({ day, currencyDisplay, basePath = "/calendario", readOnly })` — `basePath` is where closing the sheet navigates back to; `readOnly` is consumed by Task 5.

Why: today both components hardcode `/calendario`. The public calendar page will live at `/t/<token>/calendario`, so a day click or a sheet close must not silently bounce the visitor to the private, session-gated `/calendario`.

- [ ] **Step 1: Add `basePath` to `MonthGrid`**

In `components/calendar/month-grid.tsx`, change the signature:

```ts
export function MonthGrid({ days, basePath = "/calendario" }: { days: DayWithActivities[]; basePath?: string }) {
```

and change the day link:

```tsx
return tripDay ? (
  <Link
    key={iso}
    href={`${basePath}?day=${tripDay.id}`}
    className="transition-colors hover:brightness-95"
  >
    {cellBody}
  </Link>
) : (
  <div key={iso}>{cellBody}</div>
);
```

- [ ] **Step 2: Add `basePath` to `DaySheet`**

In `components/calendar/day-sheet.tsx`, change the signature and `close()`:

```ts
export function DaySheet({
  day,
  currencyDisplay,
  basePath = "/calendario",
}: {
  day: DayWithActivities | undefined;
  currencyDisplay?: CurrencyDisplay;
  basePath?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Activity | "new" | null>(null);

  function close() {
    setEditing(null);
    router.push(basePath);
  }
```

(Leave the rest of the component untouched for this task — the `readOnly` prop is added in Task 5.)

- [ ] **Step 3: Verify existing usage is unaffected**

`app/(app)/calendario/page.tsx` calls both components without `basePath`, so they default to `/calendario` — identical behavior to before.

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add components/calendar/month-grid.tsx components/calendar/day-sheet.tsx
git commit -m "refactor(calendar): make day-link base path configurable

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Thread a `readOnly` prop through the itinerary/calendar interactive components

**Files:**
- Modify: `components/itinerario/activity-card.tsx`
- Modify: `components/itinerario/day-tabs.tsx`
- Modify: `components/calendar/activity-item.tsx`
- Modify: `components/calendar/day-sheet.tsx` (continues Task 4's edit)

**Interfaces:**
- Produces: `ActivityCard({ activity, currencyDisplay, readOnly? })`
- Produces: `DayTabs({ days, currencyDisplay, readOnly? })`
- Produces: `ActivityItem({ activity, onEdit, currencyDisplay, readOnly? })`
- Produces: `DaySheet({ ..., readOnly? })`
- Consumes: `isReadOnly` from `@/lib/env` (unchanged import, now used as a fallback rather than the sole source of truth).

Pattern used in all four: today each component checks `{!isReadOnly && <edit ui>}`. Add an optional `readOnly?: boolean` prop and compute `const hideControls = readOnly ?? isReadOnly;`, then replace `!isReadOnly` with `!hideControls`. When the prop is omitted (every existing call site in the authenticated app), behavior is byte-for-byte identical. When the public route explicitly passes `readOnly`, it wins regardless of the global flag.

- [ ] **Step 1: `ActivityCard`**

In `components/itinerario/activity-card.tsx`, change the signature:

```ts
export function ActivityCard({
  activity,
  currencyDisplay,
  readOnly,
}: {
  activity: Activity;
  currencyDisplay?: CurrencyDisplay;
  readOnly?: boolean;
}) {
```

Add right after the existing `const config = ...` / `const Icon = ...` lines:

```ts
const hideControls = readOnly ?? isReadOnly;
```

Replace the one `{!isReadOnly && (` in the edit/delete button block with `{!hideControls && (`.

- [ ] **Step 2: `DayTabs`**

In `components/itinerario/day-tabs.tsx`, change the signature:

```ts
export function DayTabs({
  days,
  currencyDisplay,
  readOnly,
}: {
  days: DayWithActivities[];
  currencyDisplay?: CurrencyDisplay;
  readOnly?: boolean;
}) {
```

Add near the top of the function body:

```ts
const hideControls = readOnly ?? isReadOnly;
```

Replace both `!isReadOnly` occurrences (the "edit day" pencil button and the "Añadir actividad" button) with `!hideControls`. Pass the prop down to `ActivityCard`:

```tsx
<ActivityCard key={activity.id} activity={activity} currencyDisplay={currencyDisplay} readOnly={readOnly} />
```

- [ ] **Step 3: `ActivityItem` (calendar)**

In `components/calendar/activity-item.tsx`, same pattern:

```ts
export function ActivityItem({
  activity,
  onEdit,
  currencyDisplay,
  readOnly,
}: {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  currencyDisplay?: CurrencyDisplay;
  readOnly?: boolean;
}) {
```

```ts
const hideControls = readOnly ?? isReadOnly;
```

Replace `{!isReadOnly && (` with `{!hideControls && (` around the Editar/Borrar buttons.

- [ ] **Step 4: `DaySheet`**

Continuing Task 4's edit to `components/calendar/day-sheet.tsx`, add `readOnly` to the signature:

```ts
export function DaySheet({
  day,
  currencyDisplay,
  basePath = "/calendario",
  readOnly,
}: {
  day: DayWithActivities | undefined;
  currencyDisplay?: CurrencyDisplay;
  basePath?: string;
  readOnly?: boolean;
}) {
```

Add `const hideControls = readOnly ?? isReadOnly;` near the top of the body, replace the `{!isReadOnly && (` around the "Añadir actividad" button with `{!hideControls && (`, and pass the prop down:

```tsx
<ActivityItem
  key={activity.id}
  activity={activity}
  onEdit={setEditing}
  currencyDisplay={currencyDisplay}
  readOnly={readOnly}
/>
```

- [ ] **Step 5: Verify existing pages are unaffected**

`app/(app)/itinerario/page.tsx` and `app/(app)/calendario/page.tsx` call these components without `readOnly` — confirm by reading them that no prop is passed (they weren't touched in this task), so `hideControls` resolves to the existing global `isReadOnly` exactly as before.

Run: `npx tsc --noEmit`
Run: `npm run lint`
Expected: both clean.

Manual check: run `npm run dev`, log in, visit `/itinerario` and `/calendario` — edit/delete/add buttons still appear exactly as before (regression check for this task).

- [ ] **Step 6: Commit**

```bash
git add components/itinerario/activity-card.tsx components/itinerario/day-tabs.tsx components/calendar/activity-item.tsx components/calendar/day-sheet.tsx
git commit -m "feat(itinerario,calendar): support forcing read-only mode via prop

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: The public route

**Files:**
- Create: `components/public/public-trip-nav.tsx`
- Create: `app/(public)/t/[token]/layout.tsx`
- Create: `app/(public)/t/[token]/itinerario/page.tsx`
- Create: `app/(public)/t/[token]/mapa/page.tsx`
- Create: `app/(public)/t/[token]/calendario/page.tsx`

**Interfaces:**
- Consumes: `getTripByShareToken` (Task 1), `DayTabs`/`readOnly` (Task 5), `MonthGrid`/`DaySheet`/`basePath`/`readOnly` (Tasks 4–5), `MapLoader` (unchanged, already presentation-only).

- [ ] **Step 1: Nav component**

Create `components/public/public-trip-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "itinerario", label: "Itinerario" },
  { href: "mapa", label: "Mapa" },
  { href: "calendario", label: "Calendario" },
];

export function PublicTripNav({ token }: { token: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-neutral-100 bg-white px-4 sm:px-6">
      {TABS.map((tab) => {
        const href = `/t/${token}/${tab.href}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "border-b-2 px-3 py-2.5 text-sm font-medium",
              active ? "border-black text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-700"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Public layout**

Create `app/(public)/t/[token]/layout.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getTripByShareToken } from "@/lib/queries/trips";
import { PublicTripNav } from "@/components/public/public-trip-nav";

export default async function PublicTripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const trip = await getTripByShareToken(token);
  if (!trip) notFound();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          {trip.emoji && <span className="text-xl">{trip.emoji}</span>}
          <span className="font-bold text-neutral-900">{trip.name}</span>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
          Vista de solo lectura
        </span>
      </header>
      <PublicTripNav token={token} />
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Itinerario page**

Create `app/(public)/t/[token]/itinerario/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getTripByShareToken } from "@/lib/queries/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { DayTabs } from "@/components/itinerario/day-tabs";

export default async function PublicItinerarioPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const trip = await getTripByShareToken(token);
  if (!trip) notFound();
  const days = await getAllDaysWithActivities(trip.id);
  const currencyDisplay = { displayCurrency: trip.displayCurrency, eurToJpyRate: trip.eurToJpyRate };

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Itinerario</h1>
      </div>
      {days.length === 0 ? (
        <p className="text-sm text-neutral-400">Este viaje todavía no tiene días.</p>
      ) : (
        <DayTabs days={days} currencyDisplay={currencyDisplay} readOnly />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Mapa page**

Create `app/(public)/t/[token]/mapa/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getTripByShareToken } from "@/lib/queries/trips";
import { getMapMarkers, getMapRoutes } from "@/lib/queries/map";
import { MapLoader } from "@/components/map/map-loader";

export default async function PublicMapaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const trip = await getTripByShareToken(token);
  if (!trip) notFound();
  const [markers, routes] = await Promise.all([getMapMarkers(trip.id), getMapRoutes(trip.id)]);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Mapa de rutas</h1>
        <p className="text-sm text-neutral-400">
          {markers.length} paradas · {routes.length} trayectos
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-100">
        <MapLoader markers={markers} routes={routes} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Calendario page**

Create `app/(public)/t/[token]/calendario/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getTripByShareToken } from "@/lib/queries/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { MonthGrid } from "@/components/calendar/month-grid";
import { DaySheet } from "@/components/calendar/day-sheet";

export default async function PublicCalendarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { token } = await params;
  const trip = await getTripByShareToken(token);
  if (!trip) notFound();
  const days = await getAllDaysWithActivities(trip.id);
  const { day } = await searchParams;
  const selectedDay = day ? days.find((d) => d.id === Number(day)) : undefined;
  const currencyDisplay = { displayCurrency: trip.displayCurrency, eurToJpyRate: trip.eurToJpyRate };
  const basePath = `/t/${token}/calendario`;

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Calendario</h1>
        <p className="text-sm text-neutral-400">{days.length} días</p>
      </div>
      {days.length === 0 ? (
        <p className="text-sm text-neutral-400">Este viaje todavía no tiene días.</p>
      ) : (
        <MonthGrid days={days} basePath={basePath} />
      )}
      <DaySheet day={selectedDay} currencyDisplay={currencyDisplay} basePath={basePath} readOnly />
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Run: `npm run lint`
Expected: both clean.

Manual check (dev server, logged-out / incognito browser):
- Visit `/t/<a real shareToken from the DB>/itinerario` — loads without redirecting to `/login`, no sidebar, no edit/add/delete buttons anywhere, "Vista de solo lectura" badge visible.
- Click through to `/mapa` and `/calendario` via the nav — map renders, clicking a calendar day opens the sheet and stays on `/t/<token>/calendario?day=...` (not `/calendario`).
- Visit `/t/not-a-real-token/itinerario` — 404.
- Visit any other page (`/`, `/itinerario`, `/ajustes`, ...) logged out — still redirects to `/login` (regression check for Task 3's matcher change).

- [ ] **Step 7: Commit**

```bash
git add components/public app/"(public)"
git commit -m "feat(trips): add public read-only trip share pages

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Copy/regenerate the share link from Ajustes

**Files:**
- Modify: `lib/actions/trips.ts`
- Create: `components/settings/share-link-panel.tsx`
- Modify: `app/(app)/ajustes/page.tsx`

**Interfaces:**
- Produces: `regenerateShareToken(tripId: number): Promise<Trip>` server action.
- Consumes: `assertMutable` from `@/lib/mutation-guard` (Task 2), `Trip` type from `@/lib/queries/trips`.

- [ ] **Step 1: Add the regenerate action**

In `lib/actions/trips.ts`, add the import and the new function (place it after `deleteTrip`, before `setActiveTrip`):

```ts
import { randomBytes } from "crypto";
```

```ts
export async function regenerateShareToken(tripId: number) {
  await assertMutable();
  const shareToken = randomBytes(16).toString("hex");
  const row = await db.update(trips).set({ shareToken }).where(eq(trips.id, tripId)).returning().get();
  revalidatePath("/ajustes");
  return row;
}
```

- [ ] **Step 2: Share link panel component**

Create `components/settings/share-link-panel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { regenerateShareToken } from "@/lib/actions/trips";
import { isReadOnly } from "@/lib/env";
import type { Trip } from "@/lib/queries/trips";

export function ShareLinkPanel({ trip }: { trip: Trip }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  function shareUrl() {
    return `${window.location.origin}/t/${trip.shareToken}/itinerario`;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    await regenerateShareToken(trip.id);
    setRegenerating(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5">
      <p className="mb-3 text-sm font-semibold text-neutral-900">Compartir viaje</p>
      <p className="mb-4 text-sm text-neutral-500">
        Cualquiera con este link puede ver el itinerario, el mapa y el calendario, sin poder editarlos.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" className="rounded-full" onClick={handleCopy}>
          {copied ? "Copiado" : "Copiar link"}
        </Button>
        {!isReadOnly && (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            disabled={regenerating}
            onClick={handleRegenerate}
          >
            {regenerating ? "Regenerando…" : "Regenerar link (invalida el anterior)"}
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire it into Ajustes**

In `app/(app)/ajustes/page.tsx`, import the panel and render it right after the "Datos del viaje" card:

```tsx
import { ShareLinkPanel } from "@/components/settings/share-link-panel";
```

```tsx
{trip && (
  <div className="rounded-2xl border border-neutral-100 bg-white p-5">
    <p className="mb-3 text-sm font-semibold text-neutral-900">Datos del viaje</p>
    <p className="mb-4 text-sm text-neutral-500">
      Los días del itinerario se generan automáticamente a partir de la fecha de inicio y fin. Si acortas el
      rango, los días que queden fuera se borran junto con sus actividades.
    </p>
    <TripSettingsForm trip={trip} days={days} />
  </div>
)}

{trip && <ShareLinkPanel trip={trip} />}

<BackupPanel />
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Run: `npm run lint`
Expected: both clean.

Manual check: `npm run dev`, log in, go to `/ajustes`, click "Copiar link" (paste somewhere to confirm it matches `/t/<token>/itinerario` with the trip's current token), click "Regenerar link", confirm the copied link now 404s and a freshly copied one works.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/trips.ts components/settings/share-link-panel.tsx app/"(app)"/ajustes/page.tsx
git commit -m "feat(ajustes): add copy/regenerate controls for the public share link

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Full end-to-end pass

**Files:** none (verification only).

- [ ] **Step 1: Full regression pass, logged in**

`npm run dev`, log in normally. Walk through: create/edit/delete an activity, edit trip settings, add/remove days by changing the date range, everything in `/itinerario`, `/calendario`, `/mapa`. Confirm nothing regressed from Tasks 2, 4, 5 (the shared components now take an optional prop, but every existing call site is unchanged).

- [ ] **Step 2: Share flow, end to end**

In `/ajustes`, copy the share link. Open it in an incognito window (no session). Confirm: itinerario/mapa/calendario all load, read-only, no sidebar, "Vista de solo lectura" badge shown. Confirm every other route still bounces the incognito window to `/login`.

- [ ] **Step 3: Regenerate invalidates the old link**

Still in the authenticated tab, click "Regenerar link". Reload the old incognito tab's URL — expect 404. Copy the new link, open it in incognito — expect it to load.

- [ ] **Step 4: Full typecheck + lint**

Run: `npx tsc --noEmit`
Run: `npm run lint`
Expected: both clean, zero errors, zero warnings introduced by this feature.

- [ ] **Step 5: Final commit (if step 4 required fixes)**

Only if Step 4 needed changes:

```bash
git add -A
git commit -m "fix: address typecheck/lint issues from public share page work

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
