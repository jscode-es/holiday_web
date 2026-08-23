"use server";

import { db } from "@/db";
import { checklistItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/env";

export async function toggleChecklistItem(id: number, done: boolean) {
  assertMutable();
  db.update(checklistItems).set({ done }).where(eq(checklistItems.id, id)).run();
  revalidatePath("/presupuesto");
}

export async function createChecklistItem(label: string) {
  assertMutable();
  db.insert(checklistItems).values({ label, done: false }).run();
  revalidatePath("/presupuesto");
}
