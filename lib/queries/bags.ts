import { db } from "@/db";
import { bags, bagItems } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

export type Bag = typeof bags.$inferSelect;
export type BagItem = typeof bagItems.$inferSelect;
export type BagWithItems = Bag & { items: BagItem[] };

export async function getAllBagsWithItems(tripId: number): Promise<BagWithItems[]> {
  const allBags = await db.select().from(bags).where(eq(bags.tripId, tripId)).orderBy(asc(bags.id));
  if (allBags.length === 0) return [];
  const bagIds = allBags.map((b) => b.id);
  const allItems = await db.select().from(bagItems).where(inArray(bagItems.bagId, bagIds)).orderBy(asc(bagItems.id));
  return allBags.map((bag) => ({
    ...bag,
    items: allItems.filter((item) => item.bagId === bag.id),
  }));
}
