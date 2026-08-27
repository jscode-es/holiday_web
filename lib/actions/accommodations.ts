"use server";

import { db } from "@/db";
import { accommodations, days } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/mutation-guard";

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

export type AccommodationUpdateInput = {
  checkIn: string;
  checkOut: string;
  cost: number | null;
  currency: "EUR" | "JPY" | null;
  status: "programado" | "confirmado" | "pendiente";
  address: string | null;
  notes: string | null;
  confirmationNumber: string | null;
  roomType: string | null;
  cancellationPolicy: string | null;
  phone: string | null;
  url: string | null;
};

export async function updateAccommodation(id: number, input: AccommodationUpdateInput) {
  await assertMutable();
  const row = await db.update(accommodations).set(input).where(eq(accommodations.id, id)).returning().get();
  revalidatePath("/", "layout");
  revalidatePath("/itinerario");
  revalidatePath("/calendario");
  return row;
}
