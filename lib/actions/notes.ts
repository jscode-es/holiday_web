"use server";

import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/env";
import type { Tag } from "@/lib/tags";

function revalidateNotesPath() {
  revalidatePath("/notas");
}

export async function createNote(tripId: number, title: string, body: string, mediaUrl: string, tags: Tag[]) {
  assertMutable();
  const row = await db
    .insert(notes)
    .values({ tripId, title, body: body || null, mediaUrl: mediaUrl || null, tags })
    .returning()
    .get();
  revalidateNotesPath();
  return row;
}

export async function updateNote(id: number, title: string, body: string, mediaUrl: string, tags: Tag[]) {
  assertMutable();
  await db
    .update(notes)
    .set({ title, body: body || null, mediaUrl: mediaUrl || null, tags })
    .where(eq(notes.id, id))
    .run();
  revalidateNotesPath();
}

export async function deleteNote(id: number) {
  assertMutable();
  await db.delete(notes).where(eq(notes.id, id)).run();
  revalidateNotesPath();
}
