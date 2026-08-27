"use server";

import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/mutation-guard";
import type { Tag } from "@/lib/tags";

function revalidateNotesPath() {
  revalidatePath("/notas");
}

export async function createNote(tripId: number, title: string, body: string, mediaUrl: string, tags: Tag[]) {
  await assertMutable();
  const row = await db
    .insert(notes)
    .values({ tripId, title, body: body || null, mediaUrl: mediaUrl || null, tags })
    .returning()
    .get();
  revalidateNotesPath();
  return row;
}

export async function updateNote(id: number, title: string, body: string, mediaUrl: string, tags: Tag[]) {
  await assertMutable();
  await db
    .update(notes)
    .set({ title, body: body || null, mediaUrl: mediaUrl || null, tags })
    .where(eq(notes.id, id))
    .run();
  revalidateNotesPath();
}

export async function deleteNote(id: number) {
  await assertMutable();
  await db.delete(notes).where(eq(notes.id, id)).run();
  revalidateNotesPath();
}
