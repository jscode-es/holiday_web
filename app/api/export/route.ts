import { db } from "@/db";
import { trips, days, activities, accommodations, checklistItems, bags, bagItems } from "@/db/schema";

export async function GET() {
  const [tripsData, daysData, activitiesData, accommodationsData, checklistData, bagsData, bagItemsData] =
    await Promise.all([
      db.select().from(trips),
      db.select().from(days),
      db.select().from(activities),
      db.select().from(accommodations),
      db.select().from(checklistItems),
      db.select().from(bags),
      db.select().from(bagItems),
    ]);

  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    trips: tripsData,
    days: daysData,
    activities: activitiesData,
    accommodations: accommodationsData,
    checklistItems: checklistData,
    bags: bagsData,
    bagItems: bagItemsData,
  };

  const filename = `vacaciones-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
