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

// Shared with both the Turso (transactional) and local better-sqlite3
// (sequential, see below) paths — `executor` is either `db` itself or a
// transaction handle, both expose the same insert/delete builder API.
async function applyBackup(executor: typeof db, backup: Backup) {
  await executor.delete(activities).run();
  await executor.delete(bagItems).run();
  await executor.delete(days).run();
  await executor.delete(bags).run();
  await executor.delete(accommodations).run();
  await executor.delete(checklistItems).run();
  await executor.delete(trips).run();

  const tripsWithDates = backup.trips.map((t) => ({
    ...t,
    createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
  }));

  if (tripsWithDates.length) await executor.insert(trips).values(tripsWithDates).run();
  if (backup.days.length) await executor.insert(days).values(backup.days).run();
  if (backup.accommodations.length) await executor.insert(accommodations).values(backup.accommodations).run();
  if (backup.checklistItems.length) await executor.insert(checklistItems).values(backup.checklistItems).run();
  if (backup.bags.length) await executor.insert(bags).values(backup.bags).run();
  if (backup.activities.length) await executor.insert(activities).values(backup.activities).run();
  if (backup.bagItems.length) await executor.insert(bagItems).values(backup.bagItems).run();
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
    if (process.env.TURSO_DATABASE_URL) {
      // Turso's libsql driver supports real async interactive transactions.
      // The better-sqlite3 driver's `.transaction()` requires a synchronous
      // callback (incompatible with the awaited calls in applyBackup), so it
      // isn't used here — this branch only runs when Turso is configured.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).transaction((tx: typeof db) => applyBackup(tx, backup));
    } else {
      await applyBackup(db, backup);
    }
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
