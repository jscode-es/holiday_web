import { db } from "@/db";
import { checklistItems } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type ChecklistItem = typeof checklistItems.$inferSelect;

export async function getChecklistItems(tripId: number): Promise<ChecklistItem[]> {
  return db.select().from(checklistItems).where(eq(checklistItems.tripId, tripId)).orderBy(asc(checklistItems.id));
}
