import { db } from "./index";
import { days, activities, accommodations, checklistItems, trips } from "./schema";
import {
  daySeeds,
  activitySeeds,
  accommodationSeeds,
  checklistSeeds,
} from "./seed-data";

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

  await db.delete(activities).run();
  await db.delete(days).run();
  await db.delete(accommodations).run();
  await db.delete(checklistItems).run();

  const dayIdByNumber = new Map<number, number>();
  for (const day of daySeeds) {
    const row = await db.insert(days).values({ ...day, tripId: trip.id }).returning().get();
    dayIdByNumber.set(day.dayNumber, row.id);
  }

  for (const activity of activitySeeds) {
    const dayId = dayIdByNumber.get(activity.dayNumber);
    if (!dayId) throw new Error(`No day found for dayNumber ${activity.dayNumber}`);
    const { dayNumber, ...rest } = activity;
    void dayNumber;
    await db.insert(activities).values({ ...rest, dayId }).run();
  }

  for (const accommodation of accommodationSeeds) {
    await db.insert(accommodations).values({ ...accommodation, tripId: trip.id }).run();
  }

  for (const label of checklistSeeds) {
    await db.insert(checklistItems).values({ label, done: false, tripId: trip.id }).run();
  }

  console.log(
    `Seeded ${daySeeds.length} days, ${activitySeeds.length} activities, ${accommodationSeeds.length} accommodations, ${checklistSeeds.length} checklist items.`
  );
}

main();
