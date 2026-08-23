"use server";

import { db } from "@/db";
import { accommodations } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Looks up the accommodation matching a "hotel"-type activity's title, for the detail modal. */
export async function findAccommodationByName(name: string) {
  const [row] = await db.select().from(accommodations).where(eq(accommodations.name, name));
  return row ?? null;
}
