"use server";

import { db } from "@/db";
import { checklistItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleChecklistItem(id: number, done: boolean) {
  db.update(checklistItems).set({ done }).where(eq(checklistItems.id, id)).run();
  revalidatePath("/presupuesto");
}

export async function createChecklistItem(label: string) {
  db.insert(checklistItems).values({ label, done: false }).run();
  revalidatePath("/presupuesto");
}
