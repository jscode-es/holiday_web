"use server";

import { db } from "@/db";
import { bags, bagItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function revalidateBagsPath() {
  revalidatePath("/maletas");
}

export async function createBag(name: string) {
  const row = db.insert(bags).values({ name }).returning().get();
  revalidateBagsPath();
  return row;
}

export async function updateBagName(id: number, name: string) {
  db.update(bags).set({ name }).where(eq(bags.id, id)).run();
  revalidateBagsPath();
}

export async function deleteBag(id: number) {
  db.delete(bags).where(eq(bags.id, id)).run();
  revalidateBagsPath();
}

export async function createBagItem(bagId: number, label: string) {
  db.insert(bagItems).values({ bagId, label, packed: false }).run();
  revalidateBagsPath();
}

export async function toggleBagItem(id: number, packed: boolean) {
  db.update(bagItems).set({ packed }).where(eq(bagItems.id, id)).run();
  revalidateBagsPath();
}

export async function deleteBagItem(id: number) {
  db.delete(bagItems).where(eq(bagItems.id, id)).run();
  revalidateBagsPath();
}
