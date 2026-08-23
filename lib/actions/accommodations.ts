"use server";

import { db } from "@/db";
import { accommodations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type AccommodationInput = {
  name: string;
  checkIn: string;
  checkOut: string;
  nights: number | null;
  cost: number | null;
  currency: "EUR" | "JPY" | null;
  status: "programado" | "confirmado" | "pendiente";
  address: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  confirmationNumber: string | null;
  roomType: string | null;
  cancellationPolicy: string | null;
  phone: string | null;
};

function revalidateAccommodationPaths() {
  revalidatePath("/alojamientos");
  revalidatePath("/");
  revalidatePath("/mapa");
  revalidatePath("/presupuesto");
}

export async function createAccommodation(input: AccommodationInput) {
  const row = db.insert(accommodations).values(input).returning().get();
  revalidateAccommodationPaths();
  return row;
}

export async function updateAccommodation(id: number, input: Partial<AccommodationInput>) {
  const row = db.update(accommodations).set(input).where(eq(accommodations.id, id)).returning().get();
  revalidateAccommodationPaths();
  return row;
}

export async function deleteAccommodation(id: number) {
  db.delete(accommodations).where(eq(accommodations.id, id)).run();
  revalidateAccommodationPaths();
}

/** Looks up the accommodation matching a "hotel"-type activity's title, for the detail modal. */
export async function findAccommodationByName(name: string) {
  const [row] = await db.select().from(accommodations).where(eq(accommodations.name, name));
  return row ?? null;
}
