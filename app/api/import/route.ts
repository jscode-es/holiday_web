import { db } from "@/db";
import { trips, days, activities, accommodations, checklistItems, bags, bagItems } from "@/db/schema";

type Backup = {
  version: number;
  trips: (typeof trips.$inferInsert)[];
  days: (typeof days.$inferInsert)[];
  activities: (typeof activities.$inferInsert)[];
  accommodations: (typeof accommodations.$inferInsert)[];
  checklistItems: (typeof checklistItems.$inferInsert)[];
  bags: (typeof bags.$inferInsert)[];
  bagItems: (typeof bagItems.$inferInsert)[];
};

function isBackup(value: unknown): value is Backup {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  return (
    b.version === 2 &&
    Array.isArray(b.trips) &&
    Array.isArray(b.days) &&
    Array.isArray(b.activities) &&
    Array.isArray(b.accommodations) &&
    Array.isArray(b.checklistItems) &&
    Array.isArray(b.bags) &&
    Array.isArray(b.bagItems)
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "El archivo no es un JSON válido." }, { status: 400 });
  }

  if (!isBackup(body)) {
    return Response.json(
      { error: "El archivo no tiene el formato esperado de copia de seguridad." },
      { status: 400 }
    );
  }

  const backup = body;

  try {
    db.transaction((tx) => {
      tx.delete(activities).run();
      tx.delete(bagItems).run();
      tx.delete(days).run();
      tx.delete(bags).run();
      tx.delete(accommodations).run();
      tx.delete(checklistItems).run();
      tx.delete(trips).run();

      const tripsWithDates = backup.trips.map((t) => ({
        ...t,
        createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
      }));

      if (tripsWithDates.length) tx.insert(trips).values(tripsWithDates).run();
      if (backup.days.length) tx.insert(days).values(backup.days).run();
      if (backup.accommodations.length) tx.insert(accommodations).values(backup.accommodations).run();
      if (backup.checklistItems.length) tx.insert(checklistItems).values(backup.checklistItems).run();
      if (backup.bags.length) tx.insert(bags).values(backup.bags).run();
      if (backup.activities.length) tx.insert(activities).values(backup.activities).run();
      if (backup.bagItems.length) tx.insert(bagItems).values(backup.bagItems).run();
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? `Error al importar: ${e.message}` : "Error desconocido al importar." },
      { status: 500 }
    );
  }

  return Response.json({
    ok: true,
    counts: {
      trips: backup.trips.length,
      days: backup.days.length,
      activities: backup.activities.length,
      accommodations: backup.accommodations.length,
      checklistItems: backup.checklistItems.length,
      bags: backup.bags.length,
      bagItems: backup.bagItems.length,
    },
  });
}
