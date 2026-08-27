"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { ActivityForm } from "@/components/calendar/activity-form";
import { ActivityCard } from "./activity-card";
import { DayForm } from "./day-form";
import { isReadOnly } from "@/lib/env";
import type { DayWithActivities } from "@/lib/queries/days";
import type { CurrencyDisplay } from "@/lib/currency";

export function DayTabs({
  days,
  currencyDisplay,
  readOnly,
}: {
  days: DayWithActivities[];
  currencyDisplay?: CurrencyDisplay;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [editingDay, setEditingDay] = useState(false);
  const day = days[index];
  const hideControls = readOnly ?? isReadOnly;

  return (
    <div className="space-y-6">
      <Carousel opts={{ align: "start", dragFree: true }} className="mx-10">
        <CarouselContent className="-ml-2">
          {days.map((d, i) => {
            const pendingCount = d.activities.filter((a) => a.status === "pendiente").length;
            const active = i === index;
            return (
              <CarouselItem key={d.id} className="basis-auto pl-2">
                <button
                  onClick={() => setIndex(i)}
                  className={cn(
                    "flex min-w-23 flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-black bg-black text-white"
                      : "border-neutral-100 bg-white text-neutral-500 hover:border-neutral-200 hover:text-neutral-900"
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-2 text-xs font-semibold">
                    Día {d.dayNumber}
                    {pendingCount > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-px text-[10px] font-bold",
                          active ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
                        )}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </span>
                  <span className={cn("text-[11px]", active ? "text-white/70" : "text-neutral-400")}>
                    {d.date.slice(5)}
                  </span>
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {day && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-900">{day.title}</h2>
                {!hideControls && (
                  <Button size="icon-xs" variant="ghost" onClick={() => setEditingDay(true)} aria-label="Editar día">
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-neutral-400">
                {day.date} · {day.activities.length} {day.activities.length === 1 ? "actividad" : "actividades"}
              </p>
              {day.summary && <p className="mt-2 max-w-3xl text-sm text-neutral-500">{day.summary}</p>}
            </div>
            {!hideControls && (
              <Button size="sm" className="rounded-full" onClick={() => setAdding(true)}>
                <Plus className="size-4" />
                Añadir actividad
              </Button>
            )}
          </div>

          {day.activities.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-400">
              Sin actividades este día todavía.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {day.activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} currencyDisplay={currencyDisplay} readOnly={readOnly} />
              ))}
            </div>
          )}

          <Dialog open={adding} onOpenChange={setAdding}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  Añadir actividad · Día {day.dayNumber}
                </DialogTitle>
              </DialogHeader>
              <ActivityForm
                dayId={day.id}
                onDone={() => {
                  setAdding(false);
                  router.refresh();
                }}
              />
            </DialogContent>
          </Dialog>

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
      )}
    </div>
  );
}
