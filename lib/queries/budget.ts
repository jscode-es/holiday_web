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
