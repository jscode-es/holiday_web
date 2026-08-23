import { db } from "@/db";
import { accommodations } from "@/db/schema";
import { asc } from "drizzle-orm";

export type Accommodation = typeof accommodations.$inferSelect;

export async function getAllAccommodations(): Promise<Accommodation[]> {
  return db.select().from(accommodations).orderBy(asc(accommodations.checkIn));
}
