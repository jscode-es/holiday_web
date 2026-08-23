"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { activityImageUrl } from "@/lib/activity-image";
import { typeConfig } from "@/lib/activity-type";
import type { Activity } from "@/lib/queries/days";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 py-2 text-sm last:border-0">
      <span className="text-neutral-400">{label}</span>
      <span className="font-medium text-neutral-900">{value}</span>
    </div>
  );
}

export function ActivityDetailDialog({
  activity,
  open,
  onOpenChange,
}: {
  activity: Activity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const config = typeConfig[activity.type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="relative -mx-4 -mt-4 aspect-video overflow-hidden rounded-t-xl bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activityImageUrl(activity, 640, 360)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <DialogHeader>
          <DialogTitle>{activity.title}</DialogTitle>
          {activity.description && <DialogDescription>{activity.description}</DialogDescription>}
        </DialogHeader>
        <div>
          {activity.time && <DetailRow label="Hora" value={activity.time} />}
          <DetailRow label="Tipo" value={config.label} />
          {activity.status && <DetailRow label="Estado" value={activity.status} />}
          {activity.origin && <DetailRow label="Origen" value={activity.origin} />}
          {activity.destination && <DetailRow label="Destino" value={activity.destination} />}
          {activity.durationMin != null && <DetailRow label="Duración" value={`${activity.durationMin} min`} />}
          {activity.cost != null && <DetailRow label="Coste" value={`${activity.cost} ${activity.currency ?? ""}`} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
