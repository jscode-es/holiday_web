import { cookies } from "next/headers";
import { getAllTrips, getTripById, type Trip } from "@/lib/queries/trips";

export const ACTIVE_TRIP_COOKIE = "active_trip_id";

export async function getActiveTrip(): Promise<Trip | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACTIVE_TRIP_COOKIE)?.value;
  const id = raw ? Number(raw) : NaN;

  if (!Number.isNaN(id)) {
    const trip = await getTripById(id);
    if (trip) return trip;
  }

  const all = await getAllTrips();
  return all[all.length - 1] ?? null;
}
