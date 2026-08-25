"use server";

import { db } from "@/db";
import { trips, days } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/env";
import { ACTIVE_TRIP_COOKIE } from "@/lib/trips";

/**
 * Keeps `days` in sync with a trip's date range: adds a placeholder day for
 * every date in [startDate, endDate] that doesn't have one yet, deletes days
 * whose date fell outside the new range (cascades to their activities), and
 * renumbers everything left by date order.
 */
async function syncDaysToRange(tripId: number, startDate: string, endDate: string) {
  const existing = await db.select().from(days).where(eq(days.tripId, tripId));
  const rangeDates = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }).map((d) =>
    format(d, "yyyy-MM-dd")
  );
  const rangeSet = new Set(rangeDates);
  const existingDates = new Set(existing.map((d) => d.date));

  for (const day of existing) {
    if (!rangeSet.has(day.date)) {
      await db.delete(days).where(eq(days.id, day.id)).run();
    }
  }

  for (const date of rangeDates) {
    if (!existingDates.has(date)) {
      await db.insert(days).values({ tripId, date, dayNumber: 0, title: "Día sin planificar" }).run();
    }
  }

  const remaining = await db.select().from(days).where(eq(days.tripId, tripId)).orderBy(asc(days.date));
  for (const [index, day] of remaining.entries()) {
    const dayNumber = index + 1;
    if (day.dayNumber !== dayNumber) {
      await db.update(days).set({ dayNumber }).where(eq(days.id, day.id)).run();
    }
  }
}

export async function createTrip(input: { name: string; emoji: string | null }) {
  assertMutable();
  const name = input.name.trim();
  if (!name) throw new Error("El nombre del viaje no puede estar vacío.");
  const row = await db.insert(trips).values({ name, emoji: input.emoji }).returning().get();
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TRIP_COOKIE, String(row.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
  return row;
}

export type TripUpdateInput = {
  name: string;
  emoji: string | null;
  startDate: string | null;
  endDate: string | null;
  travelers: number | null;
};

export async function updateTrip(tripId: number, input: Partial<TripUpdateInput>) {
  assertMutable();
  const fields = { ...input };
  if (fields.name != null) {
    const trimmed = fields.name.trim();
    if (!trimmed) throw new Error("El nombre del viaje no puede estar vacío.");
    fields.name = trimmed;
  }
  if (fields.startDate && fields.endDate && fields.startDate > fields.endDate) {
    throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin.");
  }
  const row = await db.update(trips).set(fields).where(eq(trips.id, tripId)).returning().get();
  if (row.startDate && row.endDate) {
    await syncDaysToRange(tripId, row.startDate, row.endDate);
  }
  revalidatePath("/", "layout");
  revalidatePath("/calendario");
  revalidatePath("/itinerario");
  return row;
}

export async function deleteTrip(tripId: number) {
  assertMutable();
  await db.delete(trips).where(eq(trips.id, tripId)).run();
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_TRIP_COOKIE);
  revalidatePath("/", "layout");
}

export async function setActiveTrip(tripId: number) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TRIP_COOKIE, String(tripId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
}
