"use server";

import { db } from "@/db";
import { checklistItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/mutation-guard";

export async function toggleChecklistItem(id: number, done: boolean) {
  await assertMutable();
  await db.update(checklistItems).set({ done }).where(eq(checklistItems.id, id)).run();
  revalidatePath("/presupuesto");
}

export async function createChecklistItem(tripId: number, label: string) {
  await assertMutable();
  await db.insert(checklistItems).values({ tripId, label, done: false }).run();
  revalidatePath("/presupuesto");
}
