import { db } from "@/db";
import { activities, accommodations } from "@/db/schema";
import { eq } from "drizzle-orm";

export type MapMarker = { id: string; title: string; lat: number; lng: number; kind: "place" | "hotel" };
export type MapRoute = {
  id: number;
  title: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
};

export async function getMapMarkers(): Promise<MapMarker[]> {
  const placeRows = await db.select().from(activities).where(eq(activities.type, "place"));
  const places: MapMarker[] = placeRows
    .filter((a): a is typeof a & { destLat: number; destLng: number } => a.destLat != null && a.destLng != null)
    .map((a) => ({ id: `place-${a.id}`, title: a.title, lat: a.destLat, lng: a.destLng, kind: "place" as const }));

  const stayRows = await db.select().from(accommodations);
  const stays: MapMarker[] = stayRows
    .filter((s): s is typeof s & { lat: number; lng: number } => s.lat != null && s.lng != null)
    .map((s) => ({ id: `hotel-${s.id}`, title: s.name, lat: s.lat, lng: s.lng, kind: "hotel" as const }));

  return [...places, ...stays];
}

export async function getMapRoutes(): Promise<MapRoute[]> {
  const rows = await db.select().from(activities).where(eq(activities.type, "transport"));
  return rows
    .filter(
      (a): a is typeof a & { originLat: number; originLng: number; destLat: number; destLng: number } =>
        a.originLat != null && a.originLng != null && a.destLat != null && a.destLng != null
    )
    .map((a) => ({
      id: a.id,
      title: a.title,
      originLat: a.originLat,
      originLng: a.originLng,
      destLat: a.destLat,
      destLng: a.destLng,
    }));
}
