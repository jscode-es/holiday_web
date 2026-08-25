"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActivityItem } from "@/components/calendar/activity-item";
import { ActivityForm } from "@/components/calendar/activity-form";
import { DayForm } from "@/components/itinerario/day-form";
import { isReadOnly } from "@/lib/env";
import type { DayWithActivities, Activity } from "@/lib/queries/days";
import type { CurrencyDisplay } from "@/components/shared/activity-detail-dialog";

export function ItineraryPanel({
  days,
  currencyDisplay,
}: {
  days: DayWithActivities[];
  currencyDisplay?: CurrencyDisplay;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState<Activity | "new" | null>(null);
  const [editingDay, setEditingDay] = useState(false);

  const day = days[index];
  if (!day) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
      <div className="relative h-36 w-full bg-neutral-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={day.imageUrl || `https://picsum.photos/seed/day-${day.id}/800/300`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute top-3 right-3 flex items-center gap-1">
          {!isReadOnly && (
            <Button
              size="icon-sm"
              variant="secondary"
              className="bg-white/80 hover:bg-white"
              onClick={() => setEditingDay(true)}
              aria-label="Editar día"
            >
              <Pencil className="size-4" />
            </Button>
          )}
          <Button
            size="icon-sm"
            variant="secondary"
            className="bg-white/80 hover:bg-white"
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
            variant="secondary"
            className="bg-white/80 hover:bg-white"
            disabled={index === days.length - 1}
            onClick={() => {
              setEditing(null);
              setIndex((i) => Math.min(days.length - 1, i + 1));
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-neutral-900">
            {day.dayNumber}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{day.title}</p>
            <p className="text-xs text-white/70">{day.date}</p>
          </div>
        </div>
      </div>

      <div className="p-5">
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
            {!isReadOnly && (
              <Button size="sm" className="mb-2 rounded-full" onClick={() => setEditing("new")}>
                <Plus className="size-4" />
                Añadir actividad
              </Button>
            )}
            <div className="max-h-85 overflow-y-auto">
              {day.activities.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">Sin actividades este día todavía.</p>
              ) : (
                day.activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} onEdit={setEditing} currencyDisplay={currencyDisplay} />
                ))
              )}
            </div>
          </>
        )}
      </div>

      <Dialog open={editingDay} onOpenChange={setEditingDay}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar día {day.dayNumber}</DialogTitle>
          </DialogHeader>
          <DayForm
            day={day}
            onDone={() => {
              setEditingDay(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
