import { Plane, TrainFront, MapPin, Ticket, UtensilsCrossed, StickyNote, AlertTriangle, Bed, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

export function ActivityCard({ activity }: { activity: Activity }) {
  const isLongHaul = activity.type === "transport" && (activity.durationMin ?? 0) >= 360;
  const config = typeConfig[activity.type];
  const Icon = isLongHaul ? Plane : config.icon;

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-neutral-100 bg-white p-4">
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
        {activity.description && <p className="text-sm text-neutral-500">{activity.description}</p>}
      </div>

      {(activity.cost != null || activity.durationMin != null) && (
        <div className="mt-auto flex items-center gap-3 pt-1 text-xs font-medium text-neutral-400">
          {activity.cost != null && (
            <span>
              {activity.cost} {activity.currency}
            </span>
          )}
          {activity.durationMin != null && <span>{activity.durationMin} min</span>}
        </div>
      )}
    </div>
  );
}
