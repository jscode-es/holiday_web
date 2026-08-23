import { db } from "@/db";
import { activities, accommodations } from "@/db/schema";

export type BudgetSummary = {
  registeredEUR: number;
  registeredJPY: number;
  pendingCount: number;
};

export type PendingItem = { id: string; title: string; source: "activity" | "accommodation" };

export async function getBudgetSummary(): Promise<BudgetSummary> {
  const acts = await db.select().from(activities);
  const stays = await db.select().from(accommodations);

  let registeredEUR = 0;
  let registeredJPY = 0;
  let pendingCount = 0;

  for (const row of [...acts, ...stays]) {
    if (row.cost != null && row.currency === "EUR") registeredEUR += row.cost;
    if (row.cost != null && row.currency === "JPY") registeredJPY += row.cost;
    if (row.status === "pendiente") pendingCount += 1;
  }

  return { registeredEUR, registeredJPY, pendingCount };
}

export async function getPendingItems(): Promise<PendingItem[]> {
  const acts = await db.select().from(activities);
  const stays = await db.select().from(accommodations);

  return [
    ...acts
      .filter((a) => a.status === "pendiente")
      .map((a) => ({ id: `activity-${a.id}`, title: a.title, source: "activity" as const })),
    ...stays
      .filter((s) => s.status === "pendiente")
      .map((s) => ({ id: `accommodation-${s.id}`, title: s.name, source: "accommodation" as const })),
  ];
}
