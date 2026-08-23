"use server";

import { db } from "@/db";
import { days } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type DayInput = {
  date: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
};

export async function updateDay(id: number, input: Partial<DayInput>) {
  const row = db.update(days).set(input).where(eq(days.id, id)).returning().get();
  revalidatePath("/");
  revalidatePath("/calendario");
  revalidatePath("/itinerario");
  return row;
}
