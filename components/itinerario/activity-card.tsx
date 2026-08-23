"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plane,
  TrainFront,
  MapPin,
  Ticket,
  UtensilsCrossed,
  StickyNote,
  AlertTriangle,
  Bed,
  Eye,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ActivityForm } from "@/components/calendar/activity-form";
import { deleteActivity } from "@/lib/actions/activities";
import type { Activity } from "@/lib/queries/days";

const typeConfig: Record<Activity["type"], { label: string; icon: LucideIcon; bg: string; fg: string }> = {
  transport: { label: "Transporte", icon: TrainFront, bg: "bg-sky-50", fg: "text-sky-700" },
  place: { label: "Lugar", icon: MapPin, bg: "bg-emerald-50", fg: "text-emerald-700" },
  event: { label: "Evento", icon: Ticket, bg: "bg-violet-50", fg: "text-violet-700" },
  comida: { label: "Comida", icon: UtensilsCrossed, bg: "bg-amber-50", fg: "text-amber-700" },
  nota: { label: "Nota", icon: StickyNote, bg: "bg-neutral-100", fg: "text-neutral-600" },
  aviso: { label: "Aviso", icon: AlertTriangle, bg: "bg-rose-50", fg: "text-rose-700" },
  hotel: { label: "Hotel", icon: Bed, bg: "bg-neutral-900", fg: "text-white" },
};

const statusStyle: Record<string, string> = {
  pendiente: "bg-rose-100 text-rose-700",
  confirmado: "bg-emerald-100 text-emerald-700",
  programado: "bg-neutral-100 text-neutral-600",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 py-2 text-sm last:border-0">
      <span className="text-neutral-400">{label}</span>
      <span className="font-medium text-neutral-900">{value}</span>
    </div>
  );
}

export function ActivityCard({ activity }: { activity: Activity }) {
  const router = useRouter();
  const [view, setView] = useState(false);
  const [editing, setEditing] = useState(false);

  const isLongHaul = activity.type === "transport" && (activity.durationMin ?? 0) >= 360;
  const config = typeConfig[activity.type];
  const Icon = isLongHaul ? Plane : config.icon;

  async function handleDelete() {
    if (!window.confirm(`¿Borrar "${activity.title}"?`)) return;
    await deleteActivity(activity.id);
    router.refresh();
  }

  return (
    <div className="group flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4">
      {activity.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={activity.imageUrl}
          alt=""
          loading="lazy"
          className="-mx-4 -mt-4 h-28 w-[calc(100%+2rem)] object-cover"
        />
      )}
      <div className="flex items-start justify-between">
        <span className={cn("flex size-9 items-center justify-center rounded-xl", config.bg, config.fg)}>
          <Icon className="size-4.5" />
        </span>
        {activity.time && <span className="font-mono text-xs text-neutral-400">{activity.time}</span>}
      </div>

      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", config.bg, config.fg)}>
            {config.label}
          </span>
          {activity.status && (
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusStyle[activity.status])}>
              {activity.status}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-neutral-900">{activity.title}</p>
        {activity.description && <p className="line-clamp-3 text-sm text-neutral-500">{activity.description}</p>}
      </div>

      <div className="mt-auto flex items-center justify-between pt-1">
        {activity.cost != null ? (
          <span className="text-xs font-medium text-neutral-400">
            {activity.cost} {activity.currency}
          </span>
        ) : (
          <span />
        )}
        <div className="flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button size="icon-xs" variant="ghost" onClick={() => setView(true)} aria-label="Ver más">
            <Eye className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={() => setEditing(true)} aria-label="Editar">
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={handleDelete} aria-label="Borrar">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <Dialog open={view} onOpenChange={setView}>
        <DialogContent className="sm:max-w-md">
          {activity.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activity.imageUrl} alt="" className="-mx-4 -mt-4 h-40 w-[calc(100%+2rem)] rounded-t-xl object-cover" />
          )}
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
            {activity.cost != null && (
              <DetailRow label="Coste" value={`${activity.cost} ${activity.currency ?? ""}`} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar actividad</DialogTitle>
          </DialogHeader>
          <ActivityForm
            dayId={activity.dayId}
            activity={activity}
            onDone={() => {
              setEditing(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
