"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Activity } from "@/lib/queries/days";
import { deleteActivity } from "@/lib/actions/activities";

const typeLabel: Record<Activity["type"], string> = {
  transport: "Transporte",
  place: "Lugar",
  event: "Evento",
  comida: "Comida",
  nota: "Nota",
  aviso: "Aviso",
  hotel: "Hotel",
};

export function ActivityItem({ activity, onEdit }: { activity: Activity; onEdit: (activity: Activity) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-3 last:border-0">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          {activity.time && <span className="font-mono">{activity.time}</span>}
          <Badge variant="secondary">{typeLabel[activity.type]}</Badge>
          {activity.status && <Badge variant="outline">{activity.status}</Badge>}
        </div>
        <p className="font-medium">{activity.title}</p>
        {activity.description && <p className="text-sm text-muted-foreground">{activity.description}</p>}
      </div>
      <div className="flex shrink-0 gap-2">
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
