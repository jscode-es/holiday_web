import type { Activity } from "@/lib/queries/days";

/** A stable seed per activity type, so every card of that type shows the same generic reference photo. */
const TYPE_SEED: Record<Activity["type"], string> = {
  transport: "activity-transport",
  place: "activity-place",
  event: "activity-event",
  comida: "activity-food",
  nota: "activity-note",
  aviso: "activity-warning",
  hotel: "activity-hotel",
};

/** Returns the activity's own image if set, otherwise a generic 1:1 reference photo for its type. */
export function activityImageUrl(activity: Pick<Activity, "type" | "imageUrl">, size = 300): string {
  if (activity.imageUrl) return activity.imageUrl;
  return `https://picsum.photos/seed/${TYPE_SEED[activity.type]}/${size}/${size}`;
}
