import { db } from "@/db";
import { notes } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type Note = typeof notes.$inferSelect;

export async function getAllNotes(tripId: number): Promise<Note[]> {
  return db.select().from(notes).where(eq(notes.tripId, tripId)).orderBy(asc(notes.id));
}
