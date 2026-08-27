"use server";

import { db } from "@/db";
import { accommodations, days } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** Looks up the accommodation matching a "hotel"-type activity's title, scoped to the activity's trip. */
export async function findAccommodationByName(name: string, dayId: number) {
  const [day] = await db.select().from(days).where(eq(days.id, dayId));
  if (!day) return null;
  const [row] = await db
    .select()
    .from(accommodations)
    .where(and(eq(accommodations.name, name), eq(accommodations.tripId, day.tripId)));
  return row ?? null;
}
