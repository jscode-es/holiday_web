import { db } from "@/db";
import { activities, accommodations, days } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { convertToDisplay, type CurrencyDisplay } from "@/lib/currency";

export type BudgetSummary = {
  registeredEUR: number;
  registeredJPY: number;
  registeredConverted: number | null;
  accommodationsConverted: number | null;
  pendingCount: number;
};

export type PendingItem = { id: string; title: string; source: "activity" | "accommodation" };

export type DayBudgetActivity = { id: number; title: string; time: string | null; cost: number; currency: "EUR" | "JPY" };
export type DayBudget = {
  dayId: number;
  dayNumber: number;
  title: string;
  date: string;
  total: number | null;
  activities: DayBudgetActivity[];
};

function convertedTotal(rows: { cost: number | null; currency: "EUR" | "JPY" | null }[], currencyDisplay: CurrencyDisplay) {
  let total = 0;
  let hasAny = false;
  for (const row of rows) {
    if (row.cost == null || row.currency == null) continue;
    const converted = convertToDisplay(row.cost, row.currency, currencyDisplay.displayCurrency, currencyDisplay.eurToJpyRate);
    if (converted == null) return null;
    total += converted;
    hasAny = true;
  }
  return hasAny ? total : 0;
}

export async function getBudgetSummary(tripId: number, currencyDisplay: CurrencyDisplay): Promise<BudgetSummary> {
  const actRows = await db.select().from(activities).innerJoin(days, eq(activities.dayId, days.id)).where(eq(days.tripId, tripId));
  const stays = await db.select().from(accommodations).where(eq(accommodations.tripId, tripId));
  const acts = actRows.map((r) => r.activities);

  let registeredEUR = 0;
  let registeredJPY = 0;
  let pendingCount = 0;

  for (const row of [...acts, ...stays]) {
    if (row.cost != null && row.currency === "EUR") registeredEUR += row.cost;
    if (row.cost != null && row.currency === "JPY") registeredJPY += row.cost;
    if (row.status === "pendiente") pendingCount += 1;
  }

  return {
    registeredEUR,
    registeredJPY,
    registeredConverted: convertedTotal([...acts, ...stays], currencyDisplay),
    accommodationsConverted: convertedTotal(stays, currencyDisplay),
    pendingCount,
  };
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

export async function getDailyBudget(tripId: number, currencyDisplay: CurrencyDisplay): Promise<DayBudget[]> {
  const allDays = await db.select().from(days).where(eq(days.tripId, tripId)).orderBy(asc(days.dayNumber));
  if (allDays.length === 0) return [];
  const dayIds = allDays.map((d) => d.id);
  const allActivities = await db
    .select()
    .from(activities)
    .where(inArray(activities.dayId, dayIds))
    .orderBy(asc(activities.time));

  return allDays.map((day) => {
    const dayActivities = allActivities.filter((a) => a.dayId === day.id && a.cost != null && a.currency != null);
    return {
      dayId: day.id,
      dayNumber: day.dayNumber,
      title: day.title,
      date: day.date,
      total: convertedTotal(dayActivities, currencyDisplay),
      activities: dayActivities.map((a) => ({
        id: a.id,
        title: a.title,
        time: a.time,
        cost: a.cost!,
        currency: a.currency!,
      })),
    };
  });
}
