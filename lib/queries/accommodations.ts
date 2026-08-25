import { db } from "@/db";
import { accommodations } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type Accommodation = typeof accommodations.$inferSelect;

export async function getAllAccommodations(tripId: number): Promise<Accommodation[]> {
  return db.select().from(accommodations).where(eq(accommodations.tripId, tripId)).orderBy(asc(accommodations.checkIn));
}
