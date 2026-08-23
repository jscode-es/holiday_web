"use server";

import { db } from "@/db";
import { bags, bagItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertMutable } from "@/lib/env";

function revalidateBagsPath() {
  revalidatePath("/maletas");
}

export async function createBag(name: string) {
  assertMutable();
  const row = db.insert(bags).values({ name }).returning().get();
  revalidateBagsPath();
  return row;
}

export async function updateBagName(id: number, name: string) {
  assertMutable();
  db.update(bags).set({ name }).where(eq(bags.id, id)).run();
  revalidateBagsPath();
}

export async function deleteBag(id: number) {
  assertMutable();
  db.delete(bags).where(eq(bags.id, id)).run();
  revalidateBagsPath();
}

export async function createBagItem(bagId: number, label: string) {
  assertMutable();
  db.insert(bagItems).values({ bagId, label, packed: false }).run();
  revalidateBagsPath();
}

export async function toggleBagItem(id: number, packed: boolean) {
  assertMutable();
  db.update(bagItems).set({ packed }).where(eq(bagItems.id, id)).run();
  revalidateBagsPath();
}

export async function deleteBagItem(id: number) {
  assertMutable();
  db.delete(bagItems).where(eq(bagItems.id, id)).run();
  revalidateBagsPath();
}
