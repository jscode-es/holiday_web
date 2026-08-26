import { db } from "@/db";
import { utilities } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type Utility = typeof utilities.$inferSelect;

export async function getAllUtilities(tripId: number): Promise<Utility[]> {
  return db.select().from(utilities).where(eq(utilities.tripId, tripId)).orderBy(asc(utilities.id));
}
