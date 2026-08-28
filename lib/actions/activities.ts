"use server";

import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/mutation-guard";

export type ActivityInput = {
  dayId: number;
  time: string | null;
  type: "transport" | "place" | "event" | "comida" | "nota" | "aviso" | "hotel";
  title: string;
  description: string | null;
  status: "programado" | "confirmado" | "pendiente" | null;
  cost: number | null;
  currency: "EUR" | "JPY" | null;
  durationMin: number | null;
  origin: string | null;
  destination: string | null;
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
  viaLabel: string | null;
  viaLat: number | null;
  viaLng: number | null;
  imageUrl: string | null;
  videoUrl: string | null;
  url: string | null;
};

function revalidateActivityPaths() {
  revalidatePath("/");
  revalidatePath("/calendario");
  revalidatePath("/itinerario");
  revalidatePath("/mapa");
  revalidatePath("/presupuesto");
}

export async function createActivity(input: ActivityInput) {
  await assertMutable();
  const row = await db.insert(activities).values(input).returning().get();
  revalidateActivityPaths();
  return row;
}

export async function updateActivity(id: number, input: Partial<ActivityInput>) {
  await assertMutable();
  const row = await db.update(activities).set(input).where(eq(activities.id, id)).returning().get();
  revalidateActivityPaths();
  return row;
}

export async function deleteActivity(id: number) {
  await assertMutable();
  await db.delete(activities).where(eq(activities.id, id)).run();
  revalidateActivityPaths();
}
