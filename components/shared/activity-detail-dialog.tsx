"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { activityImageUrl } from "@/lib/activity-image";
import { typeConfig } from "@/lib/activity-type";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { findAccommodationByName } from "@/lib/actions/accommodations";
import { costDisplay, type CurrencyDisplay } from "@/lib/currency";
import type { Activity } from "@/lib/queries/days";
import type { Accommodation } from "@/lib/queries/accommodations";

function DetailRow({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 py-2 text-sm last:border-0">
      <span className="text-neutral-400">{label}</span>
      <span className="font-medium text-neutral-900" title={title}>
        {value}
      </span>
    </div>
  );
}

export function ActivityDetailDialog({
  activity,
  open,
  onOpenChange,
  currencyDisplay,
}: {
  activity: Activity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencyDisplay?: CurrencyDisplay;
}) {
  const config = typeConfig[activity.type];
  const embedUrl = activity.videoUrl ? youtubeEmbedUrl(activity.videoUrl) : null;
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);

  useEffect(() => {
    if (!open || activity.type !== "hotel") return;
    let cancelled = false;
    findAccommodationByName(activity.title).then((result) => {
      if (!cancelled) setAccommodation(result);
    });
    return () => {
      cancelled = true;
    };
  }, [open, activity.type, activity.title]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="relative -mx-4 -mt-4 aspect-video overflow-hidden rounded-t-xl bg-neutral-100">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="Vídeo de referencia"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activityImageUrl(activity, 640, 360)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
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
          {activity.cost != null && activity.currency && (
            <DetailRow label="Coste" {...costDisplay(activity.cost, activity.currency, currencyDisplay)} />
          )}
          {accommodation && (
            <>
              <DetailRow label="Entrada" value={accommodation.checkIn} />
              <DetailRow label="Salida" value={accommodation.checkOut} />
              {accommodation.cost != null && accommodation.currency && (
                <DetailRow label="Coste" {...costDisplay(accommodation.cost, accommodation.currency, currencyDisplay)} />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
