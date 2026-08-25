# Multi-trip app Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the app from a single hardcoded Japón 2026 itinerary into a multi-trip tool: a `trips` table, a trip switcher + creation flow in the sidebar, every existing table/query/action scoped to the active trip, and real empty states (zero trips, a trip with zero days) instead of assuming seeded data.

**Architecture:** Add a `trips` table and a `tripId` FK on `days`, `accommodations`, `checklist_items`, `bags`. The "active trip" is an httpOnly cookie read by a server helper (`getActiveTrip()`), with a fallback to the most recently created trip and a `null` empty state when there are none. Every Server Component page and query/action that reads or writes those four tables takes an explicit `tripId` parameter instead of reading the whole table.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM over `better-sqlite3` (`drizzle-kit push`, no migration files), Server Actions for writes, existing shadcn-derived UI primitives (`Dialog`, `Button`, `Input`, `Label`).

**Spec:** `docs/superpowers/specs/2026-08-25-multi-trip-app-design.md`

## Global Constraints

- No automated test suite in this project — every task is verified with `npm run lint`, `npx tsc --noEmit`, and (from Task 8 onward) a manual check against `npm run dev`, matching the convention already used in `docs/superpowers/plans/2026-08-23-japon-2026-itinerario.md`.
- Trips are global (not per-user) — no `userId` column, no session filtering (spec decision).
- `sqlite.pragma("foreign_keys = ON")` is active (`db/index.ts:24`) — every insert into `days`/`accommodations`/`checklist_items`/`bags` must carry a valid `tripId` or the insert throws.
- All new write actions must call `assertMutable()` from `lib/env.ts`, matching every existing action — except `setActiveTrip`, which only changes which trip is being viewed and must keep working in the read-only deployment.
- Existing Japón 2026 data in `sqlite.db` must not be lost — it becomes the first `trip` row via a backfill script, not deleted and reseeded.
- Follow existing file conventions: one query file per entity in `lib/queries/`, one action file per entity in `lib/actions/`, `"use server"` at the top of every action file, components colocated by feature under `components/<feature>/`.

## Deviation from the spec

The spec's "estados vacíos" section calls for a `createAccommodation` action and an
`AddAccommodationButton` alongside a "sin alojamientos" empty state. Investigation while
writing this plan found that `accommodations` today has **no display UI at all** — the
dashboard fetches `getAllAccommodations()` only to compute the readiness percentage; there is
no list, card, or detail view anywhere in the app for accommodations as their own entity (they
only surface indirectly through "hotel"-type activities). Building a new accommodations UI
that doesn't exist even for the seeded Japón trip is out of scope for "make the app
multi-trip" — it would be new functionality, not parity. This plan therefore drops
`createAccommodation`/`AddAccommodationButton`/the accommodations empty state, and only scopes
`getAllAccommodations` by `tripId` (Task 6) so the readiness/budget numbers stay correct
per trip.

Also out of scope, accepted as a known limitation: `findAccommodationByName` (used by
`ActivityDetailDialog` to enrich a "hotel" activity with check-in/out dates) matches by name
only, with no `tripId` filter. Two different trips with an identically-named hotel could show
the wrong one's details. Fixing this needs threading `tripId` through
`ActivityDetailDialog` → `ActivityCard`/`ActivityItem` → their parents (four files), for an
edge case that only matters once a second trip exists and happens to reuse a hotel name. Not
worth the prop-drilling for this iteration.

---

## Task 1: Schema — add `trips` table and nullable `tripId` columns

**Files:**
- Modify: `db/schema.ts`

**Interfaces:**
- Produces: `trips` table (Drizzle export), used by every later task. Row shape: `{ id: number, name: string, emoji: string | null, startDate: string | null, endDate: string | null, travelers: number | null, createdAt: number }`.
- Produces: nullable `tripId: number | null` column added to `days`, `accommodations`, `checklistItems`, `bags` (made `NOT NULL` in Task 3, after backfill).

- [ ] **Step 1: Add the `trips` table and nullable `tripId` columns**

Edit `db/schema.ts`. Add `sql` to the existing import and insert a new `trips` table definition before `days`:

```ts
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const trips = sqliteTable("trips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  emoji: text("emoji"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  travelers: integer("travelers"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});
```

Then add a nullable `tripId` column to each of the four tables (right after each table's `id` line):

```ts
export const days = sqliteTable("days", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  // ...unchanged fields below
```

```ts
export const accommodations = sqliteTable("accommodations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // ...unchanged fields below
```

```ts
export const checklistItems = sqliteTable("checklist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  // ...unchanged fields below
```

```ts
export const bags = sqliteTable("bags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});
```

Do not touch `activities` or `bagItems` — they inherit their trip through `dayId`/`bagId`.

- [ ] **Step 2: Push the additive schema change**

Run: `npm run db:push`
Expected: drizzle-kit reports adding the `trips` table and four nullable columns, no data-loss warning (purely additive), applies without prompting.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add db/schema.ts
git commit -m "$(cat <<'EOF'
feat(db): add trips table and nullable tripId columns

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Backfill the existing Japón 2026 data into a `trip` row

**Files:**
- Create: `scripts/backfill-trip.ts`

**Interfaces:**
- Consumes: `trips`, `days`, `accommodations`, `checklistItems`, `bags` from `db/schema.ts` (Task 1); `db` from `db/index.ts`.
- Produces: nothing importable — this is a one-off script run once, not part of the app.

- [ ] **Step 1: Write the backfill script**

Create `scripts/backfill-trip.ts`:

```ts
import { db } from "../db";
import { trips, days, accommodations, checklistItems, bags } from "../db/schema";
import { isNull, eq } from "drizzle-orm";

async function main() {
  const [existingTrip] = await db.select().from(trips).limit(1);
  const trip =
    existingTrip ??
    db
      .insert(trips)
      .values({
        name: "Japón 2026",
        emoji: "🇯🇵",
        startDate: "2026-09-27",
        endDate: "2026-10-16",
        travelers: 2,
      })
      .returning()
      .get();

  db.update(days).set({ tripId: trip.id }).where(isNull(days.tripId)).run();
  db.update(accommodations).set({ tripId: trip.id }).where(isNull(accommodations.tripId)).run();
  db.update(checklistItems).set({ tripId: trip.id }).where(isNull(checklistItems.tripId)).run();
  db.update(bags).set({ tripId: trip.id }).where(isNull(bags.tripId)).run();

  const remaining = {
    days: (await db.select().from(days).where(isNull(days.tripId))).length,
    accommodations: (await db.select().from(accommodations).where(isNull(accommodations.tripId))).length,
    checklistItems: (await db.select().from(checklistItems).where(isNull(checklistItems.tripId))).length,
    bags: (await db.select().from(bags).where(isNull(bags.tripId))).length,
  };

  console.log(`Trip "${trip.name}" (id ${trip.id}).`);
  console.log("Rows still missing tripId (should all be 0):", remaining);
  void eq;
}

main();
```

(The unused `eq` import guard (`void eq;`) is only there because `eq` isn't otherwise used; simpler: just don't import `eq` at all — remove it from the import line since only `isNull` is used.)

Correct the import line to:

```ts
import { isNull } from "drizzle-orm";
```

and delete the `void eq;` line.

- [ ] **Step 2: Run the backfill**

Run: `npx tsx scripts/backfill-trip.ts`
Expected output: `Trip "Japón 2026" (id 1).` followed by `Rows still missing tripId (should all be 0): { days: 0, accommodations: 0, checklistItems: 0, bags: 0 }`.

- [ ] **Step 3: Commit**

```bash
git add scripts/backfill-trip.ts
git commit -m "$(cat <<'EOF'
chore(db): backfill existing data into a Japón 2026 trip row

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Schema — make `tripId` required

**Files:**
- Modify: `db/schema.ts`

**Interfaces:**
- Produces: `tripId: number` (non-nullable) on `days`, `accommodations`, `checklistItems`, `bags`.

- [ ] **Step 1: Mark the four `tripId` columns `.notNull()`**

Edit `db/schema.ts`: change each of the four `tripId` column definitions added in Task 1 to:

```ts
tripId: integer("trip_id")
  .notNull()
  .references(() => trips.id, { onDelete: "cascade" }),
```

- [ ] **Step 2: Push the constraint change**

Run: `npx drizzle-kit push --force`

(`--force` auto-approves drizzle-kit's SQLite table-recreate strategy for the `NOT NULL` change; safe here because Task 2 already guaranteed every row has a `tripId`, verified by the "should all be 0" check.)

Expected: push completes, no rows lost.

- [ ] **Step 3: Verify no data was lost**

Run: `npx tsx -e "import('./db').then(async ({db}) => { const {days,accommodations,checklistItems,bags}=await import('./db/schema'); console.log({days:(await db.select().from(days)).length, accommodations:(await db.select().from(accommodations)).length, checklistItems:(await db.select().from(checklistItems)).length, bags:(await db.select().from(bags)).length}); })"`

Expected: `{ days: 20, accommodations: 3, checklistItems: 10, bags: <however many exist> }` — same counts as before Task 1 (compare against the `db:seed` output from the earlier conversation: "Seeded 20 days, 141 activities, 3 accommodations, 10 checklist items").

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add db/schema.ts
git commit -m "$(cat <<'EOF'
feat(db): require tripId on days, accommodations, checklist_items, bags

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Trip queries and active-trip helper

**Files:**
- Create: `lib/queries/trips.ts`
- Create: `lib/trips.ts`

**Interfaces:**
- Consumes: `trips` from `db/schema.ts` (Task 1), `db` from `db/index.ts`.
- Produces: `Trip` type, `getAllTrips(): Promise<Trip[]>`, `getTripById(id: number): Promise<Trip | undefined>` from `lib/queries/trips.ts`; `getActiveTrip(): Promise<Trip | null>` from `lib/trips.ts`; `ACTIVE_TRIP_COOKIE: string` exported from `lib/trips.ts` (reused by Task 5's actions).

- [ ] **Step 1: Write the trips query file**

Create `lib/queries/trips.ts`:

```ts
import { db } from "@/db";
import { trips } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type Trip = typeof trips.$inferSelect;

export async function getAllTrips(): Promise<Trip[]> {
  return db.select().from(trips).orderBy(asc(trips.createdAt));
}

export async function getTripById(id: number): Promise<Trip | undefined> {
  const [trip] = await db.select().from(trips).where(eq(trips.id, id));
  return trip;
}
```

- [ ] **Step 2: Write the active-trip helper**

Create `lib/trips.ts`:

```ts
import { cookies } from "next/headers";
import { getAllTrips, getTripById, type Trip } from "@/lib/queries/trips";

export const ACTIVE_TRIP_COOKIE = "active_trip_id";

export async function getActiveTrip(): Promise<Trip | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACTIVE_TRIP_COOKIE)?.value;
  const id = raw ? Number(raw) : NaN;

  if (!Number.isNaN(id)) {
    const trip = await getTripById(id);
    if (trip) return trip;
  }

  const all = await getAllTrips();
  return all[all.length - 1] ?? null;
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/queries/trips.ts lib/trips.ts
git commit -m "$(cat <<'EOF'
feat(trips): add trip queries and active-trip cookie helper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Trip actions (`createTrip`, `setActiveTrip`)

**Files:**
- Create: `lib/actions/trips.ts`

**Interfaces:**
- Consumes: `trips` from `db/schema.ts`, `db` from `db/index.ts`, `assertMutable` from `lib/env.ts`, `ACTIVE_TRIP_COOKIE` from `lib/trips.ts` (Task 4).
- Produces: `createTrip(input: { name: string; emoji: string | null }): Promise<Trip>`, `setActiveTrip(tripId: number): Promise<void>` — consumed by Task 9's `TripSwitcher`/`CreateTripDialog`.

- [ ] **Step 1: Write the trip actions**

Create `lib/actions/trips.ts`:

```ts
"use server";

import { db } from "@/db";
import { trips } from "@/db/schema";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/env";
import { ACTIVE_TRIP_COOKIE } from "@/lib/trips";

export async function createTrip(input: { name: string; emoji: string | null }) {
  assertMutable();
  const row = db.insert(trips).values({ name: input.name, emoji: input.emoji }).returning().get();
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TRIP_COOKIE, String(row.id), { httpOnly: true, sameSite: "lax", path: "/" });
  revalidatePath("/", "layout");
  return row;
}

export async function setActiveTrip(tripId: number) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TRIP_COOKIE, String(tripId), { httpOnly: true, sameSite: "lax", path: "/" });
  revalidatePath("/", "layout");
}
```

Note `setActiveTrip` intentionally does not call `assertMutable()` — switching which trip is active isn't a data mutation and must keep working in the read-only deployment.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/trips.ts
git commit -m "$(cat <<'EOF'
feat(trips): add createTrip and setActiveTrip actions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Scope existing read queries by `tripId`

**Files:**
- Modify: `lib/queries/days.ts`
- Modify: `lib/queries/accommodations.ts`
- Modify: `lib/queries/checklist.ts`
- Modify: `lib/queries/bags.ts`
- Modify: `lib/queries/budget.ts`
- Modify: `lib/queries/map.ts`

**Interfaces:**
- Produces (signature changes consumed by Task 11's pages):
  - `getAllDaysWithActivities(tripId: number): Promise<DayWithActivities[]>`
  - `getAllAccommodations(tripId: number): Promise<Accommodation[]>`
  - `getChecklistItems(tripId: number): Promise<ChecklistItem[]>`
  - `getAllBagsWithItems(tripId: number): Promise<BagWithItems[]>`
  - `getBudgetSummary(tripId: number): Promise<BudgetSummary>`
  - `getPendingItems(tripId: number): Promise<PendingItem[]>`
  - `getMapMarkers(tripId: number): Promise<MapMarker[]>`
  - `getMapRoutes(tripId: number): Promise<MapRoute[]>`

- [ ] **Step 1: `lib/queries/days.ts`**

Replace the file with:

```ts
import { db } from "@/db";
import { days, activities } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

export type Day = typeof days.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type DayWithActivities = Day & { activities: Activity[] };

export async function getAllDays(tripId: number): Promise<Day[]> {
  return db.select().from(days).where(eq(days.tripId, tripId)).orderBy(asc(days.dayNumber));
}

export async function getDayWithActivities(dayId: number): Promise<DayWithActivities | undefined> {
  const [day] = await db.select().from(days).where(eq(days.id, dayId));
  if (!day) return undefined;
  const dayActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.dayId, dayId))
    .orderBy(asc(activities.time));
  return { ...day, activities: dayActivities };
}

export async function getAllDaysWithActivities(tripId: number): Promise<DayWithActivities[]> {
  const allDays = await getAllDays(tripId);
  if (allDays.length === 0) return [];
  const dayIds = allDays.map((d) => d.id);
  const allActivities = await db
    .select()
    .from(activities)
    .where(inArray(activities.dayId, dayIds))
    .orderBy(asc(activities.time));
  return allDays.map((day) => ({
    ...day,
    activities: allActivities.filter((a) => a.dayId === day.id),
  }));
}
```

`getDayWithActivities` is intentionally left unscoped — it's looked up by its own unique `dayId` and today has no callers outside this file (verified by repo-wide search); scoping it is unnecessary work for dead code.

- [ ] **Step 2: `lib/queries/accommodations.ts`**

```ts
import { db } from "@/db";
import { accommodations } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type Accommodation = typeof accommodations.$inferSelect;

export async function getAllAccommodations(tripId: number): Promise<Accommodation[]> {
  return db.select().from(accommodations).where(eq(accommodations.tripId, tripId)).orderBy(asc(accommodations.checkIn));
}
```

- [ ] **Step 3: `lib/queries/checklist.ts`**

```ts
import { db } from "@/db";
import { checklistItems } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type ChecklistItem = typeof checklistItems.$inferSelect;

export async function getChecklistItems(tripId: number): Promise<ChecklistItem[]> {
  return db.select().from(checklistItems).where(eq(checklistItems.tripId, tripId)).orderBy(asc(checklistItems.id));
}
```

- [ ] **Step 4: `lib/queries/bags.ts`**

```ts
import { db } from "@/db";
import { bags, bagItems } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

export type Bag = typeof bags.$inferSelect;
export type BagItem = typeof bagItems.$inferSelect;
export type BagWithItems = Bag & { items: BagItem[] };

export async function getAllBagsWithItems(tripId: number): Promise<BagWithItems[]> {
  const allBags = await db.select().from(bags).where(eq(bags.tripId, tripId)).orderBy(asc(bags.id));
  if (allBags.length === 0) return [];
  const bagIds = allBags.map((b) => b.id);
  const allItems = await db.select().from(bagItems).where(inArray(bagItems.bagId, bagIds)).orderBy(asc(bagItems.id));
  return allBags.map((bag) => ({
    ...bag,
    items: allItems.filter((item) => item.bagId === bag.id),
  }));
}
```

- [ ] **Step 5: `lib/queries/budget.ts`**

Activities don't carry `tripId` directly (they hang off `days`), so join through `days`:

```ts
import { db } from "@/db";
import { activities, accommodations, days } from "@/db/schema";
import { eq } from "drizzle-orm";

export type BudgetSummary = {
  registeredEUR: number;
  registeredJPY: number;
  pendingCount: number;
};

export type PendingItem = { id: string; title: string; source: "activity" | "accommodation" };

export async function getBudgetSummary(tripId: number): Promise<BudgetSummary> {
  const actRows = await db.select().from(activities).innerJoin(days, eq(activities.dayId, days.id)).where(eq(days.tripId, tripId));
  const stays = await db.select().from(accommodations).where(eq(accommodations.tripId, tripId));

  let registeredEUR = 0;
  let registeredJPY = 0;
  let pendingCount = 0;

  for (const row of [...actRows.map((r) => r.activities), ...stays]) {
    if (row.cost != null && row.currency === "EUR") registeredEUR += row.cost;
    if (row.cost != null && row.currency === "JPY") registeredJPY += row.cost;
    if (row.status === "pendiente") pendingCount += 1;
  }

  return { registeredEUR, registeredJPY, pendingCount };
}

export async function getPendingItems(tripId: number): Promise<PendingItem[]> {
  const actRows = await db.select().from(activities).innerJoin(days, eq(activities.dayId, days.id)).where(eq(days.tripId, tripId));
  const stays = await db.select().from(accommodations).where(eq(accommodations.tripId, tripId));

  return [
    ...actRows
      .map((r) => r.activities)
      .filter((a) => a.status === "pendiente")
      .map((a) => ({ id: `activity-${a.id}`, title: a.title, source: "activity" as const })),
    ...stays
      .filter((s) => s.status === "pendiente")
      .map((s) => ({ id: `accommodation-${s.id}`, title: s.name, source: "accommodation" as const })),
  ];
}
```

- [ ] **Step 6: `lib/queries/map.ts`**

Same join pattern for the two activity-derived queries; accommodations stay a direct filter:

```ts
import { db } from "@/db";
import { activities, accommodations, days } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type MapMarker = { id: string; title: string; lat: number; lng: number; kind: "place" | "hotel" | "via" };
export type MapRoute = {
  id: number;
  title: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  via?: { label: string | null; lat: number; lng: number };
};

export async function getMapMarkers(tripId: number): Promise<MapMarker[]> {
  const placeRows = (
    await db
      .select()
      .from(activities)
      .innerJoin(days, eq(activities.dayId, days.id))
      .where(and(eq(days.tripId, tripId), eq(activities.type, "place")))
  ).map((r) => r.activities);
  const places: MapMarker[] = placeRows
    .filter((a): a is typeof a & { destLat: number; destLng: number } => a.destLat != null && a.destLng != null)
    .map((a) => ({ id: `place-${a.id}`, title: a.title, lat: a.destLat, lng: a.destLng, kind: "place" as const }));

  const stayRows = await db.select().from(accommodations).where(eq(accommodations.tripId, tripId));
  const stays: MapMarker[] = stayRows
    .filter((s): s is typeof s & { lat: number; lng: number } => s.lat != null && s.lng != null)
    .map((s) => ({ id: `hotel-${s.id}`, title: s.name, lat: s.lat, lng: s.lng, kind: "hotel" as const }));

  const transportRows = (
    await db
      .select()
      .from(activities)
      .innerJoin(days, eq(activities.dayId, days.id))
      .where(and(eq(days.tripId, tripId), eq(activities.type, "transport")))
  ).map((r) => r.activities);
  const viaByKey = new Map<string, MapMarker>();
  for (const a of transportRows) {
    if (a.viaLat == null || a.viaLng == null) continue;
    const key = `${a.viaLat},${a.viaLng}`;
    if (!viaByKey.has(key)) {
      viaByKey.set(key, {
        id: `via-${key}`,
        title: a.viaLabel ?? "Escala",
        lat: a.viaLat,
        lng: a.viaLng,
        kind: "via" as const,
      });
    }
  }

  return [...places, ...stays, ...viaByKey.values()];
}

export async function getMapRoutes(tripId: number): Promise<MapRoute[]> {
  const rows = (
    await db
      .select()
      .from(activities)
      .innerJoin(days, eq(activities.dayId, days.id))
      .where(and(eq(days.tripId, tripId), eq(activities.type, "transport")))
  ).map((r) => r.activities);
  return rows
    .filter(
      (a): a is typeof a & { originLat: number; originLng: number; destLat: number; destLng: number } =>
        a.originLat != null && a.originLng != null && a.destLat != null && a.destLng != null
    )
    .map((a) => ({
      id: a.id,
      title: a.title,
      originLat: a.originLat,
      originLng: a.originLng,
      destLat: a.destLat,
      destLng: a.destLng,
      via: a.viaLat != null && a.viaLng != null ? { label: a.viaLabel, lat: a.viaLat, lng: a.viaLng } : undefined,
    }));
}
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit`
Expected: errors pointing at every call site that still calls these functions without a `tripId` argument (the pages, fixed in Task 11) — confirm the *only* errors are in `app/(app)/**/page.tsx` files, nothing inside `lib/`.

- [ ] **Step 8: Commit**

```bash
git add lib/queries/days.ts lib/queries/accommodations.ts lib/queries/checklist.ts lib/queries/bags.ts lib/queries/budget.ts lib/queries/map.ts
git commit -m "$(cat <<'EOF'
feat(queries): scope all read queries by tripId

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Scope create actions by `tripId` and add `createDay`

**Files:**
- Modify: `lib/actions/bags.ts`
- Modify: `lib/actions/checklist.ts`
- Modify: `lib/actions/days.ts`
- Modify: `components/bags/add-bag-button.tsx`

**Interfaces:**
- Consumes: `getAllDays`... not needed here. Consumes nothing new beyond `db`/`schema`/`assertMutable` already used in each file.
- Produces: `createBag(tripId: number, name: string)` (signature change), `createChecklistItem(tripId: number, label: string)` (signature change, no UI caller today), `createDay(input: NewDayInput): Promise<Day>` from `lib/actions/days.ts` — consumed by Task 8's `DayForm`.

- [ ] **Step 1: `lib/actions/bags.ts` — thread `tripId` through `createBag`**

Change:

```ts
export async function createBag(name: string) {
  assertMutable();
  const row = db.insert(bags).values({ name }).returning().get();
  revalidateBagsPath();
  return row;
}
```

to:

```ts
export async function createBag(tripId: number, name: string) {
  assertMutable();
  const row = db.insert(bags).values({ tripId, name }).returning().get();
  revalidateBagsPath();
  return row;
}
```

- [ ] **Step 2: `components/bags/add-bag-button.tsx` — accept and pass `tripId`**

Change the component signature and call site:

```tsx
export function AddBagButton({ tripId }: { tripId: number }) {
```

```tsx
    await createBag(tripId, trimmed);
```

(Everything else in the file is unchanged.)

- [ ] **Step 3: `lib/actions/checklist.ts` — thread `tripId` through `createChecklistItem`**

Change:

```ts
export async function createChecklistItem(label: string) {
  assertMutable();
  db.insert(checklistItems).values({ label, done: false }).run();
  revalidatePath("/presupuesto");
}
```

to:

```ts
export async function createChecklistItem(tripId: number, label: string) {
  assertMutable();
  db.insert(checklistItems).values({ tripId, label, done: false }).run();
  revalidatePath("/presupuesto");
}
```

(No UI calls this today — verified by repo-wide search — so there is no other call site to update.)

- [ ] **Step 4: `lib/actions/days.ts` — add `createDay`**

Add a `NewDayInput` type and `createDay` function alongside the existing `updateDay`:

```ts
export type NewDayInput = {
  tripId: number;
  dayNumber: number;
  date: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
};

export async function createDay(input: NewDayInput) {
  assertMutable();
  const row = db.insert(days).values(input).returning().get();
  revalidatePath("/");
  revalidatePath("/calendario");
  revalidatePath("/itinerario");
  return row;
}
```

Full resulting file:

```ts
"use server";

import { db } from "@/db";
import { days } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/env";

export type DayInput = {
  date: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
};

export type NewDayInput = {
  tripId: number;
  dayNumber: number;
  date: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
};

export async function updateDay(id: number, input: Partial<DayInput>) {
  assertMutable();
  const row = db.update(days).set(input).where(eq(days.id, id)).returning().get();
  revalidatePath("/");
  revalidatePath("/calendario");
  revalidatePath("/itinerario");
  return row;
}

export async function createDay(input: NewDayInput) {
  assertMutable();
  const row = db.insert(days).values(input).returning().get();
  revalidatePath("/");
  revalidatePath("/calendario");
  revalidatePath("/itinerario");
  return row;
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: only remaining errors are in `app/(app)/maletas/page.tsx` (doesn't pass `tripId` to `AddBagButton` yet — fixed in Task 11) and the page files from Task 6. No errors inside `lib/` or `components/bags/`.

- [ ] **Step 6: Commit**

```bash
git add lib/actions/bags.ts lib/actions/checklist.ts lib/actions/days.ts components/bags/add-bag-button.tsx
git commit -m "$(cat <<'EOF'
feat(actions): scope create actions by tripId, add createDay

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `DayForm` create mode and `AddDayButton`

**Files:**
- Modify: `components/itinerario/day-form.tsx`
- Create: `components/days/add-day-button.tsx`

**Interfaces:**
- Consumes: `createDay`, `updateDay` from `lib/actions/days.ts` (Task 7); `Day` type from `lib/queries/days.ts`.
- Produces: `DayForm({ tripId, day?, nextDayNumber?, onDone }: { tripId: number; day?: Day; nextDayNumber?: number; onDone: () => void })` (extended signature — `tripId` is now required, `day` is now optional), `AddDayButton({ tripId, nextDayNumber }: { tripId: number; nextDayNumber: number })` — consumed by Task 11's dashboard/itinerario/calendario pages.

- [ ] **Step 1: Extend `DayForm` to support create mode**

Replace `components/itinerario/day-form.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/shared/image-uploader";
import { createDay, updateDay } from "@/lib/actions/days";
import type { Day } from "@/lib/queries/days";

export function DayForm({
  tripId,
  day,
  nextDayNumber,
  onDone,
}: {
  tripId: number;
  day?: Day;
  nextDayNumber?: number;
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState(day?.imageUrl ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);

    const fields = {
      date: formData.get("date") as string,
      title: formData.get("title") as string,
      summary: (formData.get("summary") as string) || null,
      imageUrl: imageUrl.trim() || null,
    };

    if (day) {
      await updateDay(day.id, fields);
    } else {
      await createDay({ tripId, dayNumber: nextDayNumber ?? 1, ...fields });
    }

    setSaving(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" name="date" type="date" defaultValue={day?.date} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Tema del día</Label>
          <Input id="title" name="title" defaultValue={day?.title} required placeholder="p. ej. Osaka" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Resumen</Label>
        <Textarea id="summary" name="summary" defaultValue={day?.summary ?? ""} />
      </div>

      <div className="space-y-2">
        <Label>Imagen de cabecera</Label>
        <ImageUploader value={imageUrl} onChange={setImageUrl} />
      </div>

      <Button type="submit" disabled={saving} className="rounded-full">
        {saving ? "Guardando…" : day ? "Guardar cambios del día" : "Crear día"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Check the existing caller still compiles**

`components/dashboard/itinerary-panel.tsx` and `components/itinerario/day-tabs.tsx` both render `<DayForm day={day} onDone={...} />` without `tripId` — this will now fail type-checking. Fix both call sites by adding `tripId={day.tripId}`:

In `components/dashboard/itinerary-panel.tsx`, change:

```tsx
          <DayForm
            day={day}
            onDone={() => {
```

to:

```tsx
          <DayForm
            tripId={day.tripId}
            day={day}
            onDone={() => {
```

In `components/itinerario/day-tabs.tsx`, find the equivalent `<DayForm day={day} ...>` call (it's inside the day-editing `Dialog`, further down the file past the excerpt already read) and add `tripId={day.tripId}` the same way.

- [ ] **Step 3: Create `AddDayButton`**

Create `components/days/add-day-button.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DayForm } from "@/components/itinerario/day-form";
import { isReadOnly } from "@/lib/env";

export function AddDayButton({ tripId, nextDayNumber }: { tripId: number; nextDayNumber: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (isReadOnly) return null;

  return (
    <>
      <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Añadir día
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo día</DialogTitle>
          </DialogHeader>
          <DayForm
            tripId={tripId}
            nextDayNumber={nextDayNumber}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors referencing `DayForm` or `AddDayButton`.

- [ ] **Step 5: Commit**

```bash
git add components/itinerario/day-form.tsx components/dashboard/itinerary-panel.tsx components/itinerario/day-tabs.tsx components/days/add-day-button.tsx
git commit -m "$(cat <<'EOF'
feat(days): support creating a day, not just editing one

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Trip switcher, create-trip dialog, sidebar wiring

**Files:**
- Create: `components/trips/create-trip-dialog.tsx`
- Create: `components/trips/trip-switcher.tsx`
- Modify: `components/sidebar.tsx`

**Interfaces:**
- Consumes: `createTrip`, `setActiveTrip` from `lib/actions/trips.ts` (Task 5); `Trip` type from `lib/queries/trips.ts` (Task 4); `isReadOnly` from `lib/env.ts`.
- Produces: `CreateTripDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void })`, `TripSwitcher({ activeTrip, trips }: { activeTrip: Trip; trips: Trip[] })` — consumed by Task 10's layout/`EmptyTripsState` and this task's `Sidebar`.

- [ ] **Step 1: Create the create-trip dialog**

Create `components/trips/create-trip-dialog.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createTrip } from "@/lib/actions/trips";

export function CreateTripDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await createTrip({ name: trimmed, emoji: emoji.trim() || null });
    setSaving(false);
    setName("");
    setEmoji("");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo viaje</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trip-name">Nombre</Label>
            <Input
              id="trip-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="p. ej. Italia 2027"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trip-emoji">Emoji (opcional)</Label>
            <Input
              id="trip-emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🇮🇹"
              maxLength={4}
            />
          </div>
          <Button type="submit" disabled={saving || !name.trim()} className="rounded-full">
            {saving ? "Creando…" : "Crear viaje"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create the trip switcher**

Create `components/trips/trip-switcher.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { isReadOnly } from "@/lib/env";
import { setActiveTrip } from "@/lib/actions/trips";
import { CreateTripDialog } from "@/components/trips/create-trip-dialog";
import type { Trip } from "@/lib/queries/trips";

export function TripSwitcher({ activeTrip, trips }: { activeTrip: Trip; trips: Trip[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleSelect(tripId: number) {
    setOpen(false);
    if (tripId === activeTrip.id) return;
    await setActiveTrip(tripId);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left hover:bg-neutral-50"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
          {activeTrip.emoji || "🧳"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-tight text-neutral-900">{activeTrip.name}</p>
          {(activeTrip.startDate || activeTrip.endDate) && (
            <p className="truncate text-xs text-neutral-400">
              {activeTrip.startDate ?? "?"} — {activeTrip.endDate ?? "?"}
            </p>
          )}
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-56 rounded-xl border border-neutral-100 bg-white p-1 shadow-lg">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => handleSelect(trip.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm",
                  trip.id === activeTrip.id
                    ? "bg-neutral-100 font-semibold text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50"
                )}
              >
                <span>{trip.emoji || "🧳"}</span>
                <span className="truncate">{trip.name}</span>
              </button>
            ))}
            {!isReadOnly && (
              <button
                onClick={() => {
                  setOpen(false);
                  setCreating(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                <Plus className="size-4" />
                Crear viaje
              </button>
            )}
          </div>
        </>
      )}

      <CreateTripDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
```

- [ ] **Step 3: Wire `TripSwitcher` into `Sidebar`**

Modify `components/sidebar.tsx`. Add imports and change the props signature:

```tsx
import { TripSwitcher } from "@/components/trips/trip-switcher";
import type { Trip } from "@/lib/queries/trips";
```

```tsx
export function Sidebar({ weather, trip, trips }: { weather: WeatherInfo[]; trip: Trip; trips: Trip[] }) {
```

Replace the mobile header block:

```tsx
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-100 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
            田
          </span>
          <p className="text-sm font-bold tracking-tight text-neutral-900">JAPÓN 2026</p>
        </div>
        <Button size="icon-sm" variant="ghost" onClick={() => setOpen(true)} aria-label="Abrir menú">
          <Menu className="size-5" />
        </Button>
      </header>
```

with:

```tsx
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 bg-white px-4 py-3 md:hidden">
        <div className="min-w-0 flex-1">
          <TripSwitcher activeTrip={trip} trips={trips} />
        </div>
        <Button size="icon-sm" variant="ghost" onClick={() => setOpen(true)} aria-label="Abrir menú">
          <Menu className="size-5" />
        </Button>
      </header>
```

Replace the desktop header block:

```tsx
        <div className="flex items-center justify-between gap-2 px-6 py-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
              田
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight text-neutral-900">JAPÓN 2026</p>
              <p className="text-xs text-neutral-400">27 sep — 16 oct</p>
            </div>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            className="md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="size-4" />
          </Button>
        </div>
```

with:

```tsx
        <div className="flex items-center justify-between gap-2 px-6 py-6">
          <div className="min-w-0 flex-1">
            <TripSwitcher activeTrip={trip} trips={trips} />
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            className="md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="size-4" />
          </Button>
        </div>
```

Finally, update the footer to derive traveler count from the trip instead of a hardcoded value. Replace:

```tsx
          <div>
            <p className="text-sm font-semibold text-neutral-900">Sergio</p>
            <p className="text-xs text-neutral-400">2 adultos · 20 días</p>
          </div>
```

with:

```tsx
          <div>
            <p className="text-sm font-semibold text-neutral-900">Sergio</p>
            {trip.travelers != null && (
              <p className="text-xs text-neutral-400">
                {trip.travelers} {trip.travelers === 1 ? "adulto" : "adultos"}
              </p>
            )}
          </div>
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: errors only in `app/(app)/layout.tsx` (doesn't pass `trip`/`trips` to `Sidebar` yet — fixed in Task 10).

- [ ] **Step 5: Commit**

```bash
git add components/trips/create-trip-dialog.tsx components/trips/trip-switcher.tsx components/sidebar.tsx
git commit -m "$(cat <<'EOF'
feat(trips): add trip switcher and create-trip dialog to sidebar

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Layout wiring and the zero-trips empty state

**Files:**
- Create: `components/trips/empty-trips-state.tsx`
- Modify: `app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `getActiveTrip` from `lib/trips.ts` (Task 4), `getAllTrips` from `lib/queries/trips.ts` (Task 4), `Sidebar` from `components/sidebar.tsx` (Task 9, now requires `trip`/`trips`), `CreateTripDialog` from `components/trips/create-trip-dialog.tsx` (Task 9).
- Produces: `EmptyTripsState()` component — rendered only by this task's layout.

- [ ] **Step 1: Create the empty-trips state**

Create `components/trips/empty-trips-state.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTripDialog } from "@/components/trips/create-trip-dialog";
import { isReadOnly } from "@/lib/env";

export function EmptyTripsState() {
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        <Plane className="size-6" />
      </span>
      <div>
        <p className="text-lg font-bold text-neutral-900">Aún no tienes ningún viaje</p>
        <p className="text-sm text-neutral-400">Crea tu primer viaje para empezar a planificarlo.</p>
      </div>
      {!isReadOnly && (
        <Button className="rounded-full" onClick={() => setCreating(true)}>
          Crear mi primer viaje
        </Button>
      )}
      <CreateTripDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
```

- [ ] **Step 2: Wire the layout**

Replace `app/(app)/layout.tsx` with:

```tsx
import { Sidebar } from "@/components/sidebar";
import { getWeather } from "@/lib/weather";
import { getActiveTrip } from "@/lib/trips";
import { getAllTrips } from "@/lib/queries/trips";
import { EmptyTripsState } from "@/components/trips/empty-trips-state";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [weather, trip, trips] = await Promise.all([getWeather(), getActiveTrip(), getAllTrips()]);

  if (!trip) {
    return <EmptyTripsState />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <Sidebar weather={weather} trip={trip} trips={trips} />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors related to `layout.tsx` or `Sidebar` props. Remaining errors are only inside `app/(app)/**/page.tsx` (Task 11 fixes them).

- [ ] **Step 4: Commit**

```bash
git add components/trips/empty-trips-state.tsx app/\(app\)/layout.tsx
git commit -m "$(cat <<'EOF'
feat(trips): wire active trip into the app layout, add zero-trips empty state

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Wire `tripId` through every page, add per-page empty states

**Files:**
- Modify: `app/(app)/page.tsx`
- Modify: `app/(app)/itinerario/page.tsx`
- Modify: `app/(app)/calendario/page.tsx`
- Modify: `app/(app)/mapa/page.tsx`
- Modify: `app/(app)/maletas/page.tsx`
- Modify: `app/(app)/presupuesto/page.tsx`

**Interfaces:**
- Consumes: `getActiveTrip` from `lib/trips.ts`, every scoped query from Task 6, `AddDayButton` from Task 8, `AddBagButton` (now requires `tripId`) from Task 7.

Each page below independently calls `getActiveTrip()` and returns `null` if there is none — this is required even though `app/(app)/layout.tsx` already renders `EmptyTripsState` in that case, because Next.js executes a page's Server Component regardless of whether its parent layout chooses to render `{children}`.

- [ ] **Step 1: Dashboard (`app/(app)/page.tsx`)**

Replace the file with:

```tsx
import { getActiveTrip } from "@/lib/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { getAllAccommodations } from "@/lib/queries/accommodations";
import { getBudgetSummary } from "@/lib/queries/budget";
import { getMapMarkers, getMapRoutes } from "@/lib/queries/map";
import { StatCard } from "@/components/dashboard/stat-card";
import { ItineraryPanel } from "@/components/dashboard/itinerary-panel";
import { Gallery } from "@/components/dashboard/gallery";
import { MapLoader } from "@/components/map/map-loader";
import { AddDayButton } from "@/components/days/add-day-button";

export default async function Home() {
  const trip = await getActiveTrip();
  if (!trip) return null;

  const [days, accommodations, summary, markers, routes] = await Promise.all([
    getAllDaysWithActivities(trip.id),
    getAllAccommodations(trip.id),
    getBudgetSummary(trip.id),
    getMapMarkers(trip.id),
    getMapRoutes(trip.id),
  ]);

  const allStatuses = [
    ...days.flatMap((d) => d.activities.map((a) => a.status)),
    ...accommodations.map((a) => a.status),
  ].filter((s): s is NonNullable<typeof s> => s != null);
  const readiness = allStatuses.length
    ? Math.round((allStatuses.filter((s) => s !== "pendiente").length / allStatuses.length) * 100)
    : 0;

  const dateRange =
    days.length > 0
      ? `${days[0].date} — ${days[days.length - 1].date} · ${days.length} días`
      : trip.startDate && trip.endDate
        ? `${trip.startDate} — ${trip.endDate}`
        : "Añade el primer día para ver las fechas";

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-neutral-900">
            {trip.name} {trip.emoji && <span>{trip.emoji}</span>}
          </h1>
          <p className="text-sm text-neutral-400">{dateRange}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registrado (EUR)" value={`${summary.registeredEUR.toFixed(2)} €`} hint="Vuelos y alojamientos" />
        <StatCard label="Registrado (JPY)" value={`¥${summary.registeredJPY.toFixed(0)}`} hint="Extras" />
        <StatCard label="Preparación del viaje" value={`${readiness}%`} hint="Confirmado o programado" />
        <StatCard label="Elementos pendientes" value={String(summary.pendingCount)} hint="Alojamientos y entradas" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {days.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 py-16 text-center">
              <p className="text-sm text-neutral-400">Este viaje todavía no tiene días.</p>
              <AddDayButton tripId={trip.id} nextDayNumber={1} />
            </div>
          ) : (
            <ItineraryPanel days={days} />
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-100">
          <MapLoader markers={markers} routes={routes} height="320px" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-neutral-900">Galería</p>
        <Gallery />
      </div>
    </div>
  );
}
```

(The old fixed `"24 sep — 16 oct 2026"` badge chip is dropped — it was a second, inconsistent date string next to the header's own date line.)

- [ ] **Step 2: Itinerario (`app/(app)/itinerario/page.tsx`)**

```tsx
import { getActiveTrip } from "@/lib/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { DayTabs } from "@/components/itinerario/day-tabs";
import { AddDayButton } from "@/components/days/add-day-button";

export default async function ItinerarioPage() {
  const trip = await getActiveTrip();
  if (!trip) return null;
  const days = await getAllDaysWithActivities(trip.id);

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Itinerario</h1>
        <p className="text-sm text-neutral-400">Elige un día para ver sus actividades en detalle</p>
      </div>
      {days.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm text-neutral-400">Este viaje todavía no tiene días.</p>
          <AddDayButton tripId={trip.id} nextDayNumber={1} />
        </div>
      ) : (
        <DayTabs days={days} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Calendario (`app/(app)/calendario/page.tsx`)**

```tsx
import { getActiveTrip } from "@/lib/trips";
import { getAllDaysWithActivities } from "@/lib/queries/days";
import { MonthGrid } from "@/components/calendar/month-grid";
import { DaySheet } from "@/components/calendar/day-sheet";
import { AddDayButton } from "@/components/days/add-day-button";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const trip = await getActiveTrip();
  if (!trip) return null;
  const days = await getAllDaysWithActivities(trip.id);
  const { day } = await searchParams;
  const selectedDay = day ? days.find((d) => d.id === Number(day)) : undefined;

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Calendario</h1>
        <p className="text-sm text-neutral-400">{days.length} días · haz clic en un día para ver el itinerario</p>
      </div>
      {days.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm text-neutral-400">Este viaje todavía no tiene días.</p>
          <AddDayButton tripId={trip.id} nextDayNumber={1} />
        </div>
      ) : (
        <MonthGrid days={days} />
      )}
      <DaySheet day={selectedDay} />
    </div>
  );
}
```

- [ ] **Step 4: Mapa (`app/(app)/mapa/page.tsx`)**

```tsx
import { getActiveTrip } from "@/lib/trips";
import { getMapMarkers, getMapRoutes } from "@/lib/queries/map";
import { MapLoader } from "@/components/map/map-loader";

export default async function MapaPage() {
  const trip = await getActiveTrip();
  if (!trip) return null;
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

- [ ] **Step 5: Maletas (`app/(app)/maletas/page.tsx`)**

```tsx
import { getActiveTrip } from "@/lib/trips";
import { getAllBagsWithItems } from "@/lib/queries/bags";
import { BagCard } from "@/components/bags/bag-card";
import { AddBagButton } from "@/components/bags/add-bag-button";

export default async function MaletasPage() {
  const trip = await getActiveTrip();
  if (!trip) return null;
  const bags = await getAllBagsWithItems(trip.id);
  const totalItems = bags.reduce((acc, b) => acc + b.items.length, 0);
  const packedItems = bags.reduce((acc, b) => acc + b.items.filter((i) => i.packed).length, 0);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Maletas</h1>
          <p className="text-sm text-neutral-400">
            {bags.length} {bags.length === 1 ? "maleta" : "maletas"}
            {totalItems > 0 && ` · ${packedItems}/${totalItems} preparado`}
          </p>
        </div>
        <AddBagButton tripId={trip.id} />
      </div>

      {bags.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 py-16 text-center text-sm text-neutral-400">
          Todavía no has añadido ninguna maleta. Crea la primera con &quot;Nueva maleta&quot;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bags.map((bag) => (
            <BagCard key={bag.id} bag={bag} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Presupuesto (`app/(app)/presupuesto/page.tsx`)**

```tsx
import { getActiveTrip } from "@/lib/trips";
import { getBudgetSummary, getPendingItems } from "@/lib/queries/budget";
import { getChecklistItems } from "@/lib/queries/checklist";
import { Checklist } from "@/components/budget/checklist";
import { cn } from "@/lib/utils";

export default async function PresupuestoPage() {
  const trip = await getActiveTrip();
  if (!trip) return null;
  const [summary, pending, checklist] = await Promise.all([
    getBudgetSummary(trip.id),
    getPendingItems(trip.id),
    getChecklistItems(trip.id),
  ]);

  const stats = [
    { label: "Registrado (EUR)", value: `${summary.registeredEUR.toFixed(2)} €`, className: "from-amber-200 to-orange-100" },
    { label: "Registrado (JPY)", value: `¥${summary.registeredJPY.toFixed(0)}`, className: "from-sky-200 to-blue-100" },
    { label: "Pendientes", value: String(summary.pendingCount), className: "from-rose-200 to-pink-100" },
  ];

  return (
    <div className="space-y-10 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Presupuesto</h1>
        <p className="text-sm text-neutral-400">Resumen de gastos registrados y puntos pendientes del viaje</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className={cn("rounded-2xl bg-linear-to-br p-5", stat.className)}>
            <p className="text-xs font-semibold text-neutral-600">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-neutral-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-10 sm:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">Elementos pendientes</h2>
          <ul className="space-y-2">
            {pending.map((item) => (
              <li key={item.id} className="rounded-xl border border-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700">
                {item.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">Checklist antes de salir</h2>
          <Checklist items={checklist} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors anywhere in the project.

- [ ] **Step 8: Commit**

```bash
git add "app/(app)/page.tsx" "app/(app)/itinerario/page.tsx" "app/(app)/calendario/page.tsx" "app/(app)/mapa/page.tsx" "app/(app)/maletas/page.tsx" "app/(app)/presupuesto/page.tsx"
git commit -m "$(cat <<'EOF'
feat(pages): scope all pages to the active trip, add no-days empty states

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Generic branding (metadata, login page, gallery)

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/login/page.tsx`
- Modify: `components/dashboard/gallery.tsx`

**Interfaces:** none (presentation-only changes).

- [ ] **Step 1: Root metadata**

In `app/layout.tsx`, change:

```tsx
export const metadata: Metadata = {
  title: "Japón 2026",
  description: "Itinerario del viaje a Japón, 27 sep - 16 oct 2026",
};
```

to:

```tsx
export const metadata: Metadata = {
  title: "Vacaciones",
  description: "Organiza y consulta tus viajes",
};
```

- [ ] **Step 2: Login page copy**

In `app/login/page.tsx`, change:

```tsx
          <h1 className="pt-2 text-lg font-bold tracking-tight text-neutral-900">Japón 2026</h1>
          <p className="text-sm text-neutral-400">Accede para ver el viaje</p>
```

to:

```tsx
          <h1 className="pt-2 text-lg font-bold tracking-tight text-neutral-900">Vacaciones</h1>
          <p className="text-sm text-neutral-400">Accede para ver tus viajes</p>
```

(The `田` badge above it stays — it's decorative and not exclusive to any one trip; leaving it matches YAGNI, no requirement asked for a new brand mark.)

- [ ] **Step 3: Generic gallery seeds**

`components/dashboard/gallery.tsx` hardcodes Japanese city names as `picsum.photos` seeds (placeholder imagery, not real photos). Change:

```ts
const seeds = ["fukuoka", "yufuin", "beppu", "naoshima", "osaka", "nagoya", "hakone", "tokyo"];
```

to:

```ts
const seeds = ["viaje-1", "viaje-2", "viaje-3", "viaje-4", "viaje-5", "viaje-6", "viaje-7", "viaje-8"];
```

- [ ] **Step 4: Verify**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/login/page.tsx components/dashboard/gallery.tsx
git commit -m "$(cat <<'EOF'
chore: remove Japón-specific branding now the app is multi-trip

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Include `trips` in the backup export/import

**Files:**
- Modify: `app/api/export/route.ts`
- Modify: `app/api/import/route.ts`

**Interfaces:** none new — internal shape of the backup JSON changes (`version` bumps from `1` to `2`, gains a `trips` array). Old `version: 1` backups are rejected by `isBackup()` since they predate multi-trip support and lack `tripId` on every row.

- [ ] **Step 1: Export the `trips` table**

Replace `app/api/export/route.ts` with:

```ts
import { db } from "@/db";
import { trips, days, activities, accommodations, checklistItems, bags, bagItems } from "@/db/schema";

export async function GET() {
  const [tripsData, daysData, activitiesData, accommodationsData, checklistData, bagsData, bagItemsData] =
    await Promise.all([
      db.select().from(trips),
      db.select().from(days),
      db.select().from(activities),
      db.select().from(accommodations),
      db.select().from(checklistItems),
      db.select().from(bags),
      db.select().from(bagItems),
    ]);

  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    trips: tripsData,
    days: daysData,
    activities: activitiesData,
    accommodations: accommodationsData,
    checklistItems: checklistData,
    bags: bagsData,
    bagItems: bagItemsData,
  };

  const filename = `vacaciones-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

- [ ] **Step 2: Import the `trips` table, in FK-safe order**

Replace `app/api/import/route.ts` with:

```ts
import { db } from "@/db";
import { trips, days, activities, accommodations, checklistItems, bags, bagItems } from "@/db/schema";

type Backup = {
  version: number;
  trips: (typeof trips.$inferInsert)[];
  days: (typeof days.$inferInsert)[];
  activities: (typeof activities.$inferInsert)[];
  accommodations: (typeof accommodations.$inferInsert)[];
  checklistItems: (typeof checklistItems.$inferInsert)[];
  bags: (typeof bags.$inferInsert)[];
  bagItems: (typeof bagItems.$inferInsert)[];
};

function isBackup(value: unknown): value is Backup {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  return (
    b.version === 2 &&
    Array.isArray(b.trips) &&
    Array.isArray(b.days) &&
    Array.isArray(b.activities) &&
    Array.isArray(b.accommodations) &&
    Array.isArray(b.checklistItems) &&
    Array.isArray(b.bags) &&
    Array.isArray(b.bagItems)
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "El archivo no es un JSON válido." }, { status: 400 });
  }

  if (!isBackup(body)) {
    return Response.json(
      { error: "El archivo no tiene el formato esperado de copia de seguridad." },
      { status: 400 }
    );
  }

  const backup = body;

  db.transaction((tx) => {
    tx.delete(activities).run();
    tx.delete(bagItems).run();
    tx.delete(days).run();
    tx.delete(bags).run();
    tx.delete(accommodations).run();
    tx.delete(checklistItems).run();
    tx.delete(trips).run();

    if (backup.trips.length) tx.insert(trips).values(backup.trips).run();
    if (backup.days.length) tx.insert(days).values(backup.days).run();
    if (backup.accommodations.length) tx.insert(accommodations).values(backup.accommodations).run();
    if (backup.checklistItems.length) tx.insert(checklistItems).values(backup.checklistItems).run();
    if (backup.bags.length) tx.insert(bags).values(backup.bags).run();
    if (backup.activities.length) tx.insert(activities).values(backup.activities).run();
    if (backup.bagItems.length) tx.insert(bagItems).values(backup.bagItems).run();
  });

  return Response.json({
    ok: true,
    counts: {
      trips: backup.trips.length,
      days: backup.days.length,
      activities: backup.activities.length,
      accommodations: backup.accommodations.length,
      checklistItems: backup.checklistItems.length,
      bags: backup.bags.length,
      bagItems: backup.bagItems.length,
    },
  });
}
```

Note the insert order changed from the original (`days, activities, accommodations, checklistItems, bags, bagItems`) to `trips, days, accommodations, checklistItems, bags, activities, bagItems` — every row must insert after the trip and day/bag rows it references, since `foreign_keys = ON`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/export/route.ts app/api/import/route.ts
git commit -m "$(cat <<'EOF'
feat(backup): include trips in export/import, bump backup format to v2

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Final verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full type-check and lint**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds (this also runs `scripts/ensure-db.ts` per the `build` script in `package.json`).

- [ ] **Step 3: Manual multi-trip walkthrough**

Run: `npm run dev`, then in the browser:

1. Confirm the sidebar shows "Japón 2026 🇯🇵" via the new trip switcher, and the dashboard/itinerario/calendario/mapa/maletas/presupuesto pages all show the existing Japón data exactly as before.
2. Open the trip switcher → "Crear viaje" → create a trip named "Test trip" with emoji "🧪". Confirm it becomes the active trip and the sidebar updates.
3. Confirm the dashboard, itinerario, and calendario pages for "Test trip" show the "Este viaje todavía no tiene días" empty state with a working "Añadir día" button; maletas shows its existing empty state; mapa shows "0 paradas · 0 trayectos"; presupuesto shows all-zero stats and an empty checklist.
4. Click "Añadir día" from the dashboard, fill in a date and title, submit. Confirm the day appears in itinerario and calendario for "Test trip".
5. Add a maleta from the maletas page for "Test trip".
6. Switch back to "Japón 2026" via the trip switcher. Confirm none of "Test trip"'s day or maleta show up there — trips are isolated.
7. In Ajustes, click "Descargar JSON", confirm the downloaded file has `"version": 2` and a non-empty `"trips"` array with both trips.
8. Confirm `isReadOnly` behavior is unaffected: with `NEXT_PUBLIC_READ_ONLY=1` (or by reading the code path), the "Crear viaje" option and "Añadir día"/"Nueva maleta" buttons are hidden, but switching between existing trips still works.

- [ ] **Step 4: Report results**

No commit for this task — if all checks pass, the plan is complete. If any check fails, fix the specific task above and re-run this task's checks.
