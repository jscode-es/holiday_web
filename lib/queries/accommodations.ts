import { db } from "@/db";
import { accommodations } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export type Accommodation = typeof accommodations.$inferSelect;

export async function getAllAccommodations(): Promise<Accommodation[]> {
  return db.select().from(accommodations).orderBy(asc(accommodations.checkIn));
}

export async function getAccommodationById(id: number): Promise<Accommodation | undefined> {
  const [row] = await db.select().from(accommodations).where(eq(accommodations.id, id));
  return row;
}
