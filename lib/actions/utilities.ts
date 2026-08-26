"use server";

import { db } from "@/db";
import { utilities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/env";
import type { Tag } from "@/lib/tags";

function revalidateUtilitiesPath() {
  revalidatePath("/utilidades");
}

export async function createUtility(
  tripId: number,
  title: string,
  description: string,
  url: string,
  mediaUrl: string,
  tags: Tag[]
) {
  assertMutable();
  const row = await db
    .insert(utilities)
    .values({ tripId, title, description: description || null, url: url || null, mediaUrl: mediaUrl || null, tags })
    .returning()
    .get();
  revalidateUtilitiesPath();
  return row;
}

export async function updateUtility(
  id: number,
  title: string,
  description: string,
  url: string,
  mediaUrl: string,
  tags: Tag[]
) {
  assertMutable();
  await db
    .update(utilities)
    .set({ title, description: description || null, url: url || null, mediaUrl: mediaUrl || null, tags })
    .where(eq(utilities.id, id))
    .run();
  revalidateUtilitiesPath();
}

export async function deleteUtility(id: number) {
  assertMutable();
  await db.delete(utilities).where(eq(utilities.id, id)).run();
  revalidateUtilitiesPath();
}
