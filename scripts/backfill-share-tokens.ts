import { db } from "@/db";
import { trips } from "@/db/schema";
import { isNull, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

async function main() {
  const tripsToUpdate = await db
    .select()
    .from(trips)
    .where(isNull(trips.shareToken));

  let updated = 0;
  for (const trip of tripsToUpdate) {
    await db
      .update(trips)
      .set({ shareToken: randomBytes(16).toString("hex") })
      .where(eq(trips.id, trip.id))
      .run();
    updated++;
  }

  console.log(`Updated ${updated} trips with share tokens.`);
}

main();
