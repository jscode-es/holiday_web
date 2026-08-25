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
