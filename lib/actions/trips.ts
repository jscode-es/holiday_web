"use server";

import { db } from "@/db";
import { trips } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/env";
import { ACTIVE_TRIP_COOKIE } from "@/lib/trips";

export async function createTrip(input: { name: string; emoji: string | null }) {
  assertMutable();
  const name = input.name.trim();
  if (!name) throw new Error("El nombre del viaje no puede estar vacío.");
  const row = db.insert(trips).values({ name, emoji: input.emoji }).returning().get();
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
  const row = db.update(trips).set(fields).where(eq(trips.id, tripId)).returning().get();
  revalidatePath("/", "layout");
  return row;
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
