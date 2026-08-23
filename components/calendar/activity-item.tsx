"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { activityImageUrl } from "@/lib/activity-image";
import type { Activity } from "@/lib/queries/days";
import { deleteActivity } from "@/lib/actions/activities";

const typeStyle: Record<Activity["type"], { label: string; className: string }> = {
  transport: { label: "Transporte", className: "bg-sky-50 text-sky-700" },
  place: { label: "Lugar", className: "bg-emerald-50 text-emerald-700" },
  event: { label: "Evento", className: "bg-violet-50 text-violet-700" },
  comida: { label: "Comida", className: "bg-amber-50 text-amber-700" },
  nota: { label: "Nota", className: "bg-neutral-100 text-neutral-600" },
  aviso: { label: "Aviso", className: "bg-rose-50 text-rose-700" },
  hotel: { label: "Hotel", className: "bg-neutral-900 text-white" },
};

const statusStyle: Record<string, string> = {
  pendiente: "bg-rose-100 text-rose-700",
  confirmado: "bg-emerald-100 text-emerald-700",
  programado: "bg-neutral-100 text-neutral-600",
};

export function ActivityItem({ activity, onEdit }: { activity: Activity; onEdit: (activity: Activity) => void }) {
  const type = typeStyle[activity.type];

  return (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-100 py-4 last:border-0">
      <div className="flex min-w-0 items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activityImageUrl(activity, 96)}
          alt=""
          loading="lazy"
          className="size-12 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm">
            {activity.time && <span className="font-mono text-xs text-neutral-400">{activity.time}</span>}
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", type.className)}>
              {type.label}
            </span>
            {activity.status && (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusStyle[activity.status])}>
                {activity.status}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-neutral-900">{activity.title}</p>
          {activity.description && <p className="line-clamp-2 text-sm text-neutral-500">{activity.description}</p>}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={() => onEdit(activity)}>
          Editar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => deleteActivity(activity.id)}>
          Borrar
        </Button>
      </div>
    </div>
  );
}
