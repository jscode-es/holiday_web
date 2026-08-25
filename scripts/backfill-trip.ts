import { db } from "../db";
import { trips, days, accommodations, checklistItems, bags } from "../db/schema";
import { isNull } from "drizzle-orm";

async function main() {
  const [existingTrip] = await db.select().from(trips).limit(1);
  const trip =
    existingTrip ??
    (await db
      .insert(trips)
      .values({
        name: "Japón 2026",
        emoji: "🇯🇵",
        startDate: "2026-09-27",
        endDate: "2026-10-16",
        travelers: 2,
      })
      .returning()
      .get());

  await db.update(days).set({ tripId: trip.id }).where(isNull(days.tripId)).run();
  await db.update(accommodations).set({ tripId: trip.id }).where(isNull(accommodations.tripId)).run();
  await db.update(checklistItems).set({ tripId: trip.id }).where(isNull(checklistItems.tripId)).run();
  await db.update(bags).set({ tripId: trip.id }).where(isNull(bags.tripId)).run();

  const remaining = {
    days: (await db.select().from(days).where(isNull(days.tripId))).length,
    accommodations: (await db.select().from(accommodations).where(isNull(accommodations.tripId))).length,
    checklistItems: (await db.select().from(checklistItems).where(isNull(checklistItems.tripId))).length,
    bags: (await db.select().from(bags).where(isNull(bags.tripId))).length,
  };

  console.log(`Trip "${trip.name}" (id ${trip.id}).`);
  console.log("Rows still missing tripId (should all be 0):", remaining);
}

main();
