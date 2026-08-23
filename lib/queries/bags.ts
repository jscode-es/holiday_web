import { db } from "@/db";
import { bags, bagItems } from "@/db/schema";
import { asc } from "drizzle-orm";

export type Bag = typeof bags.$inferSelect;
export type BagItem = typeof bagItems.$inferSelect;
export type BagWithItems = Bag & { items: BagItem[] };

export async function getAllBagsWithItems(): Promise<BagWithItems[]> {
  const allBags = await db.select().from(bags).orderBy(asc(bags.id));
  const allItems = await db.select().from(bagItems).orderBy(asc(bagItems.id));
  return allBags.map((bag) => ({
    ...bag,
    items: allItems.filter((item) => item.bagId === bag.id),
  }));
}
