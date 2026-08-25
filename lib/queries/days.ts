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
