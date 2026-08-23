import { db } from "@/db";
import { days, activities, accommodations, checklistItems, bags, bagItems } from "@/db/schema";

export async function GET() {
  const [
    daysData,
    activitiesData,
    accommodationsData,
    checklistData,
    bagsData,
    bagItemsData,
  ] = await Promise.all([
    db.select().from(days),
    db.select().from(activities),
    db.select().from(accommodations),
    db.select().from(checklistItems),
    db.select().from(bags),
    db.select().from(bagItems),
  ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    days: daysData,
    activities: activitiesData,
    accommodations: accommodationsData,
    checklistItems: checklistData,
    bags: bagsData,
    bagItems: bagItemsData,
  };

  const filename = `japon-2026-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
