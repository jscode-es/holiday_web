"use server";

import { db } from "@/db";
import { trips } from "@/db/schema";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/env";
import { ACTIVE_TRIP_COOKIE } from "@/lib/trips";

export async function createTrip(input: { name: string; emoji: string | null }) {
  assertMutable();
  const row = db.insert(trips).values({ name: input.name, emoji: input.emoji }).returning().get();
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TRIP_COOKIE, String(row.id), { httpOnly: true, sameSite: "lax", path: "/" });
  revalidatePath("/", "layout");
  return row;
}

export async function setActiveTrip(tripId: number) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TRIP_COOKIE, String(tripId), { httpOnly: true, sameSite: "lax", path: "/" });
  revalidatePath("/", "layout");
}
