"use server";

import { db } from "@/db";
import { bags, bagItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/env";

function revalidateBagsPath() {
  revalidatePath("/maletas");
}

export async function createBag(tripId: number, name: string) {
  assertMutable();
  const row = await db.insert(bags).values({ tripId, name }).returning().get();
  revalidateBagsPath();
  return row;
}

export async function updateBagName(id: number, name: string) {
  assertMutable();
  await db.update(bags).set({ name }).where(eq(bags.id, id)).run();
  revalidateBagsPath();
}

export async function deleteBag(id: number) {
  assertMutable();
  await db.delete(bags).where(eq(bags.id, id)).run();
  revalidateBagsPath();
}

export async function createBagItem(bagId: number, label: string) {
  assertMutable();
  await db.insert(bagItems).values({ bagId, label, packed: false }).run();
  revalidateBagsPath();
}

export async function toggleBagItem(id: number, packed: boolean) {
  assertMutable();
  await db.update(bagItems).set({ packed }).where(eq(bagItems.id, id)).run();
  revalidateBagsPath();
}

export async function deleteBagItem(id: number) {
  assertMutable();
  await db.delete(bagItems).where(eq(bagItems.id, id)).run();
  revalidateBagsPath();
}
