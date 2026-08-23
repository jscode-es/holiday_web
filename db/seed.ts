import { db } from "./index";
import { days, activities, accommodations, checklistItems } from "./schema";
import {
  daySeeds,
  activitySeeds,
  accommodationSeeds,
  checklistSeeds,
} from "./seed-data";

async function main() {
  db.delete(activities).run();
  db.delete(days).run();
  db.delete(accommodations).run();
  db.delete(checklistItems).run();

  const dayIdByNumber = new Map<number, number>();
  for (const day of daySeeds) {
    const row = db.insert(days).values(day).returning().get();
    dayIdByNumber.set(day.dayNumber, row.id);
  }

  for (const activity of activitySeeds) {
    const dayId = dayIdByNumber.get(activity.dayNumber);
    if (!dayId) throw new Error(`No day found for dayNumber ${activity.dayNumber}`);
    const { dayNumber, ...rest } = activity;
    void dayNumber;
    db.insert(activities).values({ ...rest, dayId }).run();
  }

  for (const accommodation of accommodationSeeds) {
    db.insert(accommodations).values(accommodation).run();
  }

  for (const label of checklistSeeds) {
    db.insert(checklistItems).values({ label, done: false }).run();
  }

  console.log(
    `Seeded ${daySeeds.length} days, ${activitySeeds.length} activities, ${accommodationSeeds.length} accommodations, ${checklistSeeds.length} checklist items.`
  );
}

main();
