import { db } from "@/db";
import { checklistItems } from "@/db/schema";
import { asc } from "drizzle-orm";

export type ChecklistItem = typeof checklistItems.$inferSelect;

export async function getChecklistItems(): Promise<ChecklistItem[]> {
  return db.select().from(checklistItems).orderBy(asc(checklistItems.id));
}
