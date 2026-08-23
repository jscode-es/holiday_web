"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityItem } from "@/components/calendar/activity-item";
import { ActivityForm } from "@/components/calendar/activity-form";
import type { DayWithActivities, Activity } from "@/lib/queries/days";

export function ItineraryPanel({ days }: { days: DayWithActivities[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState<Activity | "new" | null>(null);

  const day = days[index];
  if (!day) return null;

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
            {day.dayNumber}
          </span>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{day.title}</p>
            <p className="text-xs text-neutral-400">{day.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={index === 0}
            onClick={() => {
              setEditing(null);
              setIndex((i) => Math.max(0, i - 1));
            }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={index === days.length - 1}
            onClick={() => {
              setEditing(null);
              setIndex((i) => Math.min(days.length - 1, i + 1));
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {editing ? (
        <ActivityForm
          dayId={day.id}
          activity={editing === "new" ? undefined : editing}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : (
        <>
          <Button size="sm" className="mb-2 rounded-full" onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            Añadir actividad
          </Button>
          <div className="max-h-[380px] overflow-y-auto">
            {day.activities.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">Sin actividades este día todavía.</p>
            ) : (
              day.activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} onEdit={setEditing} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
